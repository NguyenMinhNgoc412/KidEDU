const UINT32_BASE = 0x1_0000_0000;

const HEADER_MAGIC = new Uint8Array([0x4b, 0x49, 0x44, 0x45, 0x44, 0x55, 0x00, 0x01]);
const FOOTER_MAGIC = new Uint8Array([0x4b, 0x49, 0x44, 0x45, 0x4e, 0x44, 0x00, 0x01]);

const STORED_MANIFEST_KIND = "kidedu-local-backup";
const DEFAULT_MAX_PAYLOAD_COUNT = 10_000;
const MAX_CHUNK_SIZE = 8 * 1024 * 1024;

export const KIDEDU_ARCHIVE_V1_LAYOUT = Object.freeze({
  version: 1,
  headerSize: 16,
  footerSize: 40,
  footerManifestOffsetOffset: 16,
  footerManifestLengthOffset: 24,
  footerManifestCrc32Offset: 32,
  footerPayloadCountOffset: 36,
  defaultChunkSize: 512 * 1024,
  defaultMaxManifestBytes: 8 * 1024 * 1024
});

export type ArchiveCodecErrorCode =
  | "ARCHIVE_CHANGED"
  | "CHECKSUM_MISMATCH"
  | "DUPLICATE_PAYLOAD_PATH"
  | "INVALID_FOOTER"
  | "INVALID_HEADER"
  | "INVALID_MANIFEST"
  | "INVALID_NUMBER"
  | "INVALID_OPTION"
  | "INVALID_PAYLOAD_PATH"
  | "INVALID_PAYLOAD_RANGE"
  | "MANIFEST_TOO_LARGE"
  | "PAYLOAD_NOT_FOUND"
  | "TRUNCATED_DATA"
  | "UNSUPPORTED_VERSION";

export class ArchiveCodecError extends Error {
  readonly code: ArchiveCodecErrorCode;
  readonly payloadPath: string | null;

  constructor(code: ArchiveCodecErrorCode, message: string, payloadPath: string | null = null) {
    super(message);
    this.name = "ArchiveCodecError";
    this.code = code;
    this.payloadPath = payloadPath;
  }
}

export interface ArchiveByteReader {
  readonly size: number;
  read(offset: number, length: number): Promise<Uint8Array>;
}

export interface ArchiveByteWriter {
  /** The writer must write the complete chunk or reject. */
  write(offset: number, bytes: Uint8Array): Promise<void>;
}

export interface ArchivePayloadSource {
  path: string;
  reader: ArchiveByteReader;
}

export interface ArchivePayloadDescriptor {
  readonly path: string;
  readonly offset: number;
  readonly size: number;
  readonly crc32: number;
}

export interface KidEduArchiveIndex {
  readonly archiveVersion: 1;
  readonly archiveSize: number;
  readonly manifestOffset: number;
  readonly manifestLength: number;
  readonly manifestCrc32: number;
  readonly manifest: unknown;
  readonly payloads: readonly ArchivePayloadDescriptor[];
}

export type ArchiveProgressPhase =
  "extract-payload" | "read-manifest" | "verify-payloads" | "write-manifest" | "write-payloads";

export interface ArchiveProgress {
  readonly phase: ArchiveProgressPhase;
  readonly payloadPath: string | null;
  readonly processedBytes: number;
  readonly totalBytes: number;
}

export interface ArchiveCodecOptions {
  chunkSize?: number;
  maxManifestBytes?: number;
  maxPayloadCount?: number;
  onProgress?: (progress: ArchiveProgress) => void | Promise<void>;
  /** Called after each streamed chunk. The native wrapper can yield to the UI event loop here. */
  yieldControl?: () => void | Promise<void>;
}

export type ArchiveManifestBuilder = (
  payloads: readonly ArchivePayloadDescriptor[]
) => unknown | Promise<unknown>;

interface StoredArchiveManifest {
  kind: typeof STORED_MANIFEST_KIND;
  archiveVersion: 1;
  manifest: unknown;
  payloads: readonly ArchivePayloadDescriptor[];
}

interface ResolvedOptions {
  chunkSize: number;
  maxManifestBytes: number;
  maxPayloadCount: number;
  onProgress: ArchiveCodecOptions["onProgress"];
  yieldControl: ArchiveCodecOptions["yieldControl"];
}

interface ParsedFooter {
  manifestOffset: number;
  manifestLength: number;
  manifestCrc32: number;
  payloadCount: number;
}

const CRC32_TABLE = createCrc32Table();

export class Crc32 {
  private state = 0xffff_ffff;

  update(bytes: Uint8Array): this {
    let value = this.state;

    for (let index = 0; index < bytes.byteLength; index += 1) {
      const byte = bytes[index] ?? 0;
      const tableValue = CRC32_TABLE[(value ^ byte) & 0xff] ?? 0;
      value = (tableValue ^ (value >>> 8)) >>> 0;
    }

    this.state = value;
    return this;
  }

  digest(): number {
    return (this.state ^ 0xffff_ffff) >>> 0;
  }

  digestHex(): string {
    return formatCrc32(this.digest());
  }
}

export function crc32(bytes: Uint8Array): number {
  return new Crc32().update(bytes).digest();
}

export function formatCrc32(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new ArchiveCodecError("INVALID_NUMBER", "CRC32 must be an unsigned 32-bit integer.");
  }

  return value.toString(16).padStart(8, "0");
}

export async function writeKidEduArchive(
  writer: ArchiveByteWriter,
  sources: readonly ArchivePayloadSource[],
  buildManifest: ArchiveManifestBuilder,
  options: ArchiveCodecOptions = {}
): Promise<KidEduArchiveIndex> {
  const resolvedOptions = resolveOptions(options);
  validatePayloadSources(sources, resolvedOptions.maxPayloadCount);

  await writer.write(0, createHeader());

  const totalPayloadBytes = sources.reduce(
    (total, source) => safeAdd(total, source.reader.size, "Total payload size is too large."),
    0
  );
  const descriptors: ArchivePayloadDescriptor[] = [];
  let archiveOffset: number = KIDEDU_ARCHIVE_V1_LAYOUT.headerSize;
  let processedPayloadBytes = 0;

  await reportProgress(resolvedOptions, {
    phase: "write-payloads",
    payloadPath: sources[0]?.path ?? null,
    processedBytes: 0,
    totalBytes: totalPayloadBytes
  });

  for (const source of sources) {
    const payloadOffset = archiveOffset;
    const checksum = new Crc32();

    await streamRange(source.reader, 0, source.reader.size, resolvedOptions, async (bytes) => {
      checksum.update(bytes);
      await writer.write(archiveOffset, bytes);
      archiveOffset = safeAdd(archiveOffset, bytes.byteLength, "Archive size is too large.");
      processedPayloadBytes = safeAdd(
        processedPayloadBytes,
        bytes.byteLength,
        "Processed payload size is too large."
      );
      await reportProgress(resolvedOptions, {
        phase: "write-payloads",
        payloadPath: source.path,
        processedBytes: processedPayloadBytes,
        totalBytes: totalPayloadBytes
      });
    });

    descriptors.push(
      Object.freeze({
        path: source.path,
        offset: payloadOffset,
        size: source.reader.size,
        crc32: checksum.digest()
      })
    );
  }

  const frozenDescriptors = Object.freeze([...descriptors]);
  const businessManifest = await buildManifest(frozenDescriptors);
  if (businessManifest === undefined) {
    throw new ArchiveCodecError("INVALID_MANIFEST", "The archive manifest cannot be undefined.");
  }

  const storedManifest: StoredArchiveManifest = {
    kind: STORED_MANIFEST_KIND,
    archiveVersion: KIDEDU_ARCHIVE_V1_LAYOUT.version,
    manifest: businessManifest,
    payloads: frozenDescriptors
  };
  const manifestBytes = encodeJson(storedManifest);

  if (manifestBytes.byteLength > resolvedOptions.maxManifestBytes) {
    throw new ArchiveCodecError(
      "MANIFEST_TOO_LARGE",
      `Manifest is ${manifestBytes.byteLength} bytes; maximum is ${resolvedOptions.maxManifestBytes}.`
    );
  }

  const manifestOffset = archiveOffset;
  const manifestCrc32 = crc32(manifestBytes);
  let writtenManifestBytes = 0;

  await reportProgress(resolvedOptions, {
    phase: "write-manifest",
    payloadPath: null,
    processedBytes: 0,
    totalBytes: manifestBytes.byteLength
  });

  while (writtenManifestBytes < manifestBytes.byteLength) {
    const chunkEnd = Math.min(
      writtenManifestBytes + resolvedOptions.chunkSize,
      manifestBytes.byteLength
    );
    const chunk = manifestBytes.subarray(writtenManifestBytes, chunkEnd);
    await writer.write(archiveOffset, chunk);
    archiveOffset = safeAdd(archiveOffset, chunk.byteLength, "Archive size is too large.");
    writtenManifestBytes += chunk.byteLength;
    await reportProgress(resolvedOptions, {
      phase: "write-manifest",
      payloadPath: null,
      processedBytes: writtenManifestBytes,
      totalBytes: manifestBytes.byteLength
    });
    await yieldControl(resolvedOptions);
  }

  const footer = createFooter({
    manifestOffset,
    manifestLength: manifestBytes.byteLength,
    manifestCrc32,
    payloadCount: frozenDescriptors.length
  });
  await writer.write(archiveOffset, footer);
  const archiveSize = safeAdd(archiveOffset, footer.byteLength, "Archive size is too large.");

  return freezeIndex({
    archiveVersion: 1,
    archiveSize,
    manifestOffset,
    manifestLength: manifestBytes.byteLength,
    manifestCrc32,
    manifest: businessManifest,
    payloads: frozenDescriptors
  });
}

export async function inspectKidEduArchive(
  reader: ArchiveByteReader,
  options: ArchiveCodecOptions = {}
): Promise<KidEduArchiveIndex> {
  const resolvedOptions = resolveOptions(options);
  validateReaderSize(reader.size);

  const minimumSize = safeAdd(
    KIDEDU_ARCHIVE_V1_LAYOUT.headerSize,
    KIDEDU_ARCHIVE_V1_LAYOUT.footerSize,
    "Archive layout is invalid."
  );
  if (reader.size <= minimumSize) {
    throw new ArchiveCodecError("TRUNCATED_DATA", "Archive is too short to contain a manifest.");
  }

  const headerBytes = await readExact(
    reader,
    0,
    KIDEDU_ARCHIVE_V1_LAYOUT.headerSize,
    resolvedOptions.chunkSize
  );
  validateHeader(headerBytes);

  const footerOffset = reader.size - KIDEDU_ARCHIVE_V1_LAYOUT.footerSize;
  const footerBytes = await readExact(
    reader,
    footerOffset,
    KIDEDU_ARCHIVE_V1_LAYOUT.footerSize,
    resolvedOptions.chunkSize
  );
  const footer = parseFooter(footerBytes);

  if (footer.manifestLength <= 0) {
    throw new ArchiveCodecError("INVALID_FOOTER", "Manifest length must be greater than zero.");
  }
  if (footer.manifestLength > resolvedOptions.maxManifestBytes) {
    throw new ArchiveCodecError(
      "MANIFEST_TOO_LARGE",
      `Manifest is ${footer.manifestLength} bytes; maximum is ${resolvedOptions.maxManifestBytes}.`
    );
  }
  if (footer.payloadCount > resolvedOptions.maxPayloadCount) {
    throw new ArchiveCodecError(
      "INVALID_MANIFEST",
      `Archive contains ${footer.payloadCount} payloads; maximum is ${resolvedOptions.maxPayloadCount}.`
    );
  }
  if (footer.manifestOffset < KIDEDU_ARCHIVE_V1_LAYOUT.headerSize) {
    throw new ArchiveCodecError("INVALID_FOOTER", "Manifest overlaps the archive header.");
  }

  const manifestEnd = safeAdd(
    footer.manifestOffset,
    footer.manifestLength,
    "Manifest range is too large."
  );
  if (manifestEnd !== footerOffset) {
    throw new ArchiveCodecError(
      "INVALID_FOOTER",
      "Manifest must end exactly where the fixed archive footer begins."
    );
  }

  await reportProgress(resolvedOptions, {
    phase: "read-manifest",
    payloadPath: null,
    processedBytes: 0,
    totalBytes: footer.manifestLength
  });

  const manifestBytes = new Uint8Array(footer.manifestLength);
  let manifestBytesRead = 0;
  await streamRange(
    reader,
    footer.manifestOffset,
    footer.manifestLength,
    resolvedOptions,
    async (bytes) => {
      manifestBytes.set(bytes, manifestBytesRead);
      manifestBytesRead += bytes.byteLength;
      await reportProgress(resolvedOptions, {
        phase: "read-manifest",
        payloadPath: null,
        processedBytes: manifestBytesRead,
        totalBytes: footer.manifestLength
      });
    }
  );

  const actualManifestCrc32 = crc32(manifestBytes);
  if (actualManifestCrc32 !== footer.manifestCrc32) {
    throw checksumError("manifest", footer.manifestCrc32, actualManifestCrc32, null);
  }

  const storedManifest = parseStoredManifest(manifestBytes);
  if (storedManifest.payloads.length !== footer.payloadCount) {
    throw new ArchiveCodecError(
      "INVALID_MANIFEST",
      "Footer payload count does not match the manifest."
    );
  }

  const payloads = validateStoredPayloads(
    storedManifest.payloads,
    footer.manifestOffset,
    resolvedOptions.maxPayloadCount
  );

  return freezeIndex({
    archiveVersion: 1,
    archiveSize: reader.size,
    manifestOffset: footer.manifestOffset,
    manifestLength: footer.manifestLength,
    manifestCrc32: footer.manifestCrc32,
    manifest: storedManifest.manifest,
    payloads
  });
}

export async function verifyKidEduArchivePayloads(
  reader: ArchiveByteReader,
  archive: KidEduArchiveIndex,
  options: ArchiveCodecOptions = {}
): Promise<void> {
  const resolvedOptions = resolveOptions(options);
  assertArchiveUnchanged(reader, archive);
  const totalBytes = archive.payloads.reduce(
    (total, payload) => safeAdd(total, payload.size, "Total payload size is too large."),
    0
  );
  let processedBytes = 0;

  await reportProgress(resolvedOptions, {
    phase: "verify-payloads",
    payloadPath: archive.payloads[0]?.path ?? null,
    processedBytes: 0,
    totalBytes
  });

  for (const payload of archive.payloads) {
    const checksum = new Crc32();
    await streamRange(reader, payload.offset, payload.size, resolvedOptions, async (bytes) => {
      checksum.update(bytes);
      processedBytes = safeAdd(processedBytes, bytes.byteLength, "Processed size is too large.");
      await reportProgress(resolvedOptions, {
        phase: "verify-payloads",
        payloadPath: payload.path,
        processedBytes,
        totalBytes
      });
    });

    const actualCrc32 = checksum.digest();
    if (actualCrc32 !== payload.crc32) {
      throw checksumError(payload.path, payload.crc32, actualCrc32, payload.path);
    }
  }
}

export async function extractKidEduArchivePayload(
  reader: ArchiveByteReader,
  archive: KidEduArchiveIndex,
  payloadPath: string,
  writer: ArchiveByteWriter,
  options: ArchiveCodecOptions = {}
): Promise<ArchivePayloadDescriptor> {
  const resolvedOptions = resolveOptions(options);
  assertArchiveUnchanged(reader, archive);
  const payload = archive.payloads.find((candidate) => candidate.path === payloadPath);

  if (!payload) {
    throw new ArchiveCodecError(
      "PAYLOAD_NOT_FOUND",
      `Archive payload was not found: ${payloadPath}`,
      payloadPath
    );
  }

  const checksum = new Crc32();
  let writtenBytes = 0;
  await reportProgress(resolvedOptions, {
    phase: "extract-payload",
    payloadPath,
    processedBytes: 0,
    totalBytes: payload.size
  });

  await streamRange(reader, payload.offset, payload.size, resolvedOptions, async (bytes) => {
    checksum.update(bytes);
    await writer.write(writtenBytes, bytes);
    writtenBytes = safeAdd(writtenBytes, bytes.byteLength, "Extracted size is too large.");
    await reportProgress(resolvedOptions, {
      phase: "extract-payload",
      payloadPath,
      processedBytes: writtenBytes,
      totalBytes: payload.size
    });
  });

  const actualCrc32 = checksum.digest();
  if (actualCrc32 !== payload.crc32) {
    throw checksumError(payload.path, payload.crc32, actualCrc32, payload.path);
  }

  return payload;
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb8_8320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

function resolveOptions(options: ArchiveCodecOptions): ResolvedOptions {
  const chunkSize = options.chunkSize ?? KIDEDU_ARCHIVE_V1_LAYOUT.defaultChunkSize;
  const maxManifestBytes =
    options.maxManifestBytes ?? KIDEDU_ARCHIVE_V1_LAYOUT.defaultMaxManifestBytes;
  const maxPayloadCount = options.maxPayloadCount ?? DEFAULT_MAX_PAYLOAD_COUNT;

  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0 || chunkSize > MAX_CHUNK_SIZE) {
    throw new ArchiveCodecError(
      "INVALID_OPTION",
      `chunkSize must be a positive safe integer no greater than ${MAX_CHUNK_SIZE}.`
    );
  }
  if (!Number.isSafeInteger(maxManifestBytes) || maxManifestBytes <= 0) {
    throw new ArchiveCodecError(
      "INVALID_OPTION",
      "maxManifestBytes must be a positive safe integer."
    );
  }
  if (
    !Number.isSafeInteger(maxPayloadCount) ||
    maxPayloadCount < 0 ||
    maxPayloadCount > 0xffff_ffff
  ) {
    throw new ArchiveCodecError(
      "INVALID_OPTION",
      "maxPayloadCount must be an unsigned 32-bit integer."
    );
  }

  return {
    chunkSize,
    maxManifestBytes,
    maxPayloadCount,
    onProgress: options.onProgress,
    yieldControl: options.yieldControl
  };
}

function validatePayloadSources(
  sources: readonly ArchivePayloadSource[],
  maxPayloadCount: number
): void {
  if (sources.length > maxPayloadCount || sources.length > 0xffff_ffff) {
    throw new ArchiveCodecError(
      "INVALID_MANIFEST",
      `Archive contains too many payloads: ${sources.length}.`
    );
  }

  const paths = new Set<string>();
  for (const source of sources) {
    validateSafePayloadPath(source.path);
    const canonicalPath = canonicalizePayloadPath(source.path);
    if (paths.has(canonicalPath)) {
      throw new ArchiveCodecError(
        "DUPLICATE_PAYLOAD_PATH",
        `Duplicate archive payload path: ${source.path}`,
        source.path
      );
    }
    paths.add(canonicalPath);
    validateReaderSize(source.reader.size, source.path);
  }
}

function validateReaderSize(size: number, payloadPath: string | null = null): void {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new ArchiveCodecError(
      "INVALID_NUMBER",
      "Reader size must be a non-negative safe integer.",
      payloadPath
    );
  }
}

function validateSafePayloadPath(path: string): void {
  const hasControlCharacter = [...path].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
  const segments = path.split("/");
  const isUnsafe =
    path.length === 0 ||
    path.length > 1024 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":") ||
    hasControlCharacter ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..");

  if (isUnsafe) {
    throw new ArchiveCodecError(
      "INVALID_PAYLOAD_PATH",
      `Unsafe archive payload path: ${path}`,
      path
    );
  }
}

function canonicalizePayloadPath(path: string): string {
  return path.normalize("NFC").toLowerCase();
}

function createHeader(): Uint8Array {
  const header = new Uint8Array(KIDEDU_ARCHIVE_V1_LAYOUT.headerSize);
  header.set(HEADER_MAGIC, 0);
  const view = dataView(header);
  view.setUint32(8, KIDEDU_ARCHIVE_V1_LAYOUT.version, true);
  view.setUint32(12, KIDEDU_ARCHIVE_V1_LAYOUT.headerSize, true);
  return header;
}

function validateHeader(header: Uint8Array): void {
  if (
    header.byteLength !== KIDEDU_ARCHIVE_V1_LAYOUT.headerSize ||
    !hasMagic(header, HEADER_MAGIC)
  ) {
    throw new ArchiveCodecError("INVALID_HEADER", "KidEDU archive header is invalid.");
  }

  const view = dataView(header);
  const version = view.getUint32(8, true);
  if (version !== KIDEDU_ARCHIVE_V1_LAYOUT.version) {
    throw new ArchiveCodecError(
      "UNSUPPORTED_VERSION",
      `Unsupported KidEDU archive version: ${version}.`
    );
  }
  if (view.getUint32(12, true) !== KIDEDU_ARCHIVE_V1_LAYOUT.headerSize) {
    throw new ArchiveCodecError("INVALID_HEADER", "KidEDU archive header size is invalid.");
  }
}

function createFooter(footer: ParsedFooter): Uint8Array {
  const bytes = new Uint8Array(KIDEDU_ARCHIVE_V1_LAYOUT.footerSize);
  bytes.set(FOOTER_MAGIC, 0);
  const view = dataView(bytes);
  view.setUint32(8, KIDEDU_ARCHIVE_V1_LAYOUT.version, true);
  view.setUint32(12, KIDEDU_ARCHIVE_V1_LAYOUT.footerSize, true);
  writeSafeUint64(view, KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestOffsetOffset, footer.manifestOffset);
  writeSafeUint64(view, KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestLengthOffset, footer.manifestLength);
  view.setUint32(KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestCrc32Offset, footer.manifestCrc32, true);
  view.setUint32(KIDEDU_ARCHIVE_V1_LAYOUT.footerPayloadCountOffset, footer.payloadCount, true);
  return bytes;
}

function parseFooter(bytes: Uint8Array): ParsedFooter {
  if (bytes.byteLength !== KIDEDU_ARCHIVE_V1_LAYOUT.footerSize || !hasMagic(bytes, FOOTER_MAGIC)) {
    throw new ArchiveCodecError("INVALID_FOOTER", "KidEDU archive footer is invalid.");
  }

  const view = dataView(bytes);
  const version = view.getUint32(8, true);
  if (version !== KIDEDU_ARCHIVE_V1_LAYOUT.version) {
    throw new ArchiveCodecError(
      "UNSUPPORTED_VERSION",
      `Unsupported KidEDU archive footer version: ${version}.`
    );
  }
  if (view.getUint32(12, true) !== KIDEDU_ARCHIVE_V1_LAYOUT.footerSize) {
    throw new ArchiveCodecError("INVALID_FOOTER", "KidEDU archive footer size is invalid.");
  }

  return {
    manifestOffset: readSafeUint64(
      view,
      KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestOffsetOffset,
      "Manifest offset"
    ),
    manifestLength: readSafeUint64(
      view,
      KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestLengthOffset,
      "Manifest length"
    ),
    manifestCrc32: view.getUint32(KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestCrc32Offset, true),
    payloadCount: view.getUint32(KIDEDU_ARCHIVE_V1_LAYOUT.footerPayloadCountOffset, true)
  };
}

function writeSafeUint64(view: DataView, offset: number, value: number): void {
  assertSafeNonNegativeInteger(value, "64-bit archive value");
  const low = value % UINT32_BASE;
  const high = Math.floor(value / UINT32_BASE);
  view.setUint32(offset, low, true);
  view.setUint32(offset + 4, high, true);
}

function readSafeUint64(view: DataView, offset: number, label: string): number {
  const low = view.getUint32(offset, true);
  const high = view.getUint32(offset + 4, true);
  const value = high * UINT32_BASE + low;
  assertSafeNonNegativeInteger(value, label);
  return value;
}

function assertSafeNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ArchiveCodecError("INVALID_NUMBER", `${label} must be a non-negative safe integer.`);
  }
}

function safeAdd(left: number, right: number, message: string): number {
  assertSafeNonNegativeInteger(left, "Left operand");
  assertSafeNonNegativeInteger(right, "Right operand");
  const value = left + right;
  if (!Number.isSafeInteger(value)) {
    throw new ArchiveCodecError("INVALID_NUMBER", message);
  }
  return value;
}

function dataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function hasMagic(bytes: Uint8Array, magic: Uint8Array): boolean {
  if (bytes.byteLength < magic.byteLength) {
    return false;
  }

  for (let index = 0; index < magic.byteLength; index += 1) {
    if (bytes[index] !== magic[index]) {
      return false;
    }
  }
  return true;
}

function encodeJson(value: unknown): Uint8Array {
  try {
    const json = JSON.stringify(value);
    if (json === undefined) {
      throw new ArchiveCodecError("INVALID_MANIFEST", "Manifest is not JSON serializable.");
    }
    return new TextEncoder().encode(json);
  } catch (error) {
    if (error instanceof ArchiveCodecError) {
      throw error;
    }
    throw new ArchiveCodecError(
      "INVALID_MANIFEST",
      `Manifest is not JSON serializable: ${errorMessage(error)}`
    );
  }
}

function parseStoredManifest(bytes: Uint8Array): StoredArchiveManifest {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch (error) {
    throw new ArchiveCodecError(
      "INVALID_MANIFEST",
      `Archive manifest is not valid UTF-8 JSON: ${errorMessage(error)}`
    );
  }

  if (!isRecord(value)) {
    throw new ArchiveCodecError("INVALID_MANIFEST", "Archive manifest must be an object.");
  }
  if (value.kind !== STORED_MANIFEST_KIND) {
    throw new ArchiveCodecError("INVALID_MANIFEST", "Archive manifest kind is invalid.");
  }
  if (value.archiveVersion !== KIDEDU_ARCHIVE_V1_LAYOUT.version) {
    throw new ArchiveCodecError(
      "UNSUPPORTED_VERSION",
      `Unsupported manifest archive version: ${String(value.archiveVersion)}.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(value, "manifest")) {
    throw new ArchiveCodecError("INVALID_MANIFEST", "Archive business manifest is missing.");
  }
  if (!Array.isArray(value.payloads)) {
    throw new ArchiveCodecError("INVALID_MANIFEST", "Archive payload index must be an array.");
  }

  return {
    kind: STORED_MANIFEST_KIND,
    archiveVersion: 1,
    manifest: value.manifest,
    payloads: value.payloads as ArchivePayloadDescriptor[]
  };
}

function validateStoredPayloads(
  input: readonly ArchivePayloadDescriptor[],
  manifestOffset: number,
  maxPayloadCount: number
): readonly ArchivePayloadDescriptor[] {
  if (input.length > maxPayloadCount) {
    throw new ArchiveCodecError("INVALID_MANIFEST", "Archive contains too many payloads.");
  }

  const paths = new Set<string>();
  const result: ArchivePayloadDescriptor[] = [];
  let expectedOffset: number = KIDEDU_ARCHIVE_V1_LAYOUT.headerSize;

  for (const unknownPayload of input as readonly unknown[]) {
    if (!isRecord(unknownPayload)) {
      throw new ArchiveCodecError("INVALID_MANIFEST", "Payload descriptor must be an object.");
    }

    const { path, offset, size, crc32: expectedCrc32 } = unknownPayload;
    if (typeof path !== "string") {
      throw new ArchiveCodecError("INVALID_PAYLOAD_PATH", "Payload path must be a string.");
    }
    validateSafePayloadPath(path);
    const canonicalPath = canonicalizePayloadPath(path);
    if (paths.has(canonicalPath)) {
      throw new ArchiveCodecError(
        "DUPLICATE_PAYLOAD_PATH",
        `Duplicate archive payload path: ${path}`,
        path
      );
    }
    paths.add(canonicalPath);

    if (typeof offset !== "number" || !Number.isSafeInteger(offset) || offset < 0) {
      throw new ArchiveCodecError("INVALID_PAYLOAD_RANGE", `Invalid payload offset: ${path}`, path);
    }
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) {
      throw new ArchiveCodecError("INVALID_PAYLOAD_RANGE", `Invalid payload size: ${path}`, path);
    }
    if (
      typeof expectedCrc32 !== "number" ||
      !Number.isInteger(expectedCrc32) ||
      expectedCrc32 < 0 ||
      expectedCrc32 > 0xffff_ffff
    ) {
      throw new ArchiveCodecError("INVALID_MANIFEST", `Invalid payload CRC32: ${path}`, path);
    }

    if (offset !== expectedOffset) {
      throw new ArchiveCodecError(
        "INVALID_PAYLOAD_RANGE",
        `Payload ranges are not canonical or overlap at: ${path}`,
        path
      );
    }
    const payloadEnd = safeAdd(offset, size, `Payload range is too large: ${path}`);
    if (payloadEnd > manifestOffset) {
      throw new ArchiveCodecError(
        "INVALID_PAYLOAD_RANGE",
        `Payload overlaps the archive manifest: ${path}`,
        path
      );
    }

    expectedOffset = payloadEnd;
    result.push(
      Object.freeze({
        path,
        offset,
        size,
        crc32: expectedCrc32
      })
    );
  }

  if (expectedOffset !== manifestOffset) {
    throw new ArchiveCodecError(
      "INVALID_PAYLOAD_RANGE",
      "Payload ranges must end exactly where the archive manifest begins."
    );
  }

  return Object.freeze(result);
}

async function streamRange(
  reader: ArchiveByteReader,
  start: number,
  length: number,
  options: ResolvedOptions,
  onChunk: (bytes: Uint8Array) => void | Promise<void>
): Promise<void> {
  assertSafeNonNegativeInteger(start, "Range start");
  assertSafeNonNegativeInteger(length, "Range length");
  const end = safeAdd(start, length, "Read range is too large.");
  if (end > reader.size) {
    throw new ArchiveCodecError("TRUNCATED_DATA", "Read range extends beyond the source.");
  }

  let processed = 0;
  while (processed < length) {
    const requestedLength = Math.min(options.chunkSize, length - processed);
    const bytes = await reader.read(start + processed, requestedLength);
    if (bytes.byteLength <= 0) {
      throw new ArchiveCodecError("TRUNCATED_DATA", "Reader ended before the requested range.");
    }
    if (bytes.byteLength > requestedLength) {
      throw new ArchiveCodecError("TRUNCATED_DATA", "Reader returned more bytes than requested.");
    }

    await onChunk(bytes);
    processed += bytes.byteLength;
    await yieldControl(options);
  }
}

async function readExact(
  reader: ArchiveByteReader,
  offset: number,
  length: number,
  chunkSize: number
): Promise<Uint8Array> {
  const bytes = new Uint8Array(length);
  let read = 0;

  while (read < length) {
    const requestedLength = Math.min(chunkSize, length - read);
    const chunk = await reader.read(offset + read, requestedLength);
    if (chunk.byteLength <= 0 || chunk.byteLength > requestedLength) {
      throw new ArchiveCodecError("TRUNCATED_DATA", "Could not read the requested archive bytes.");
    }
    bytes.set(chunk, read);
    read += chunk.byteLength;
  }

  return bytes;
}

async function reportProgress(options: ResolvedOptions, progress: ArchiveProgress): Promise<void> {
  await options.onProgress?.(progress);
}

async function yieldControl(options: ResolvedOptions): Promise<void> {
  await options.yieldControl?.();
}

function assertArchiveUnchanged(reader: ArchiveByteReader, archive: KidEduArchiveIndex): void {
  validateReaderSize(reader.size);
  if (reader.size !== archive.archiveSize) {
    throw new ArchiveCodecError(
      "ARCHIVE_CHANGED",
      "Archive size changed after its manifest was inspected."
    );
  }
}

function checksumError(
  label: string,
  expected: number,
  actual: number,
  payloadPath: string | null
): ArchiveCodecError {
  return new ArchiveCodecError(
    "CHECKSUM_MISMATCH",
    `CRC32 mismatch for ${label}: expected ${formatCrc32(expected)}, got ${formatCrc32(actual)}.`,
    payloadPath
  );
}

function freezeIndex(index: KidEduArchiveIndex): KidEduArchiveIndex {
  return Object.freeze(index);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
