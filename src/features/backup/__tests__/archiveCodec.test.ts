import {
  ArchiveCodecError,
  Crc32,
  KIDEDU_ARCHIVE_V1_LAYOUT,
  crc32,
  extractKidEduArchivePayload,
  formatCrc32,
  inspectKidEduArchive,
  verifyKidEduArchivePayloads,
  writeKidEduArchive
} from "../archiveCodec";
import type {
  ArchiveByteReader,
  ArchiveByteWriter,
  ArchiveCodecErrorCode,
  ArchiveProgress,
  KidEduArchiveIndex
} from "../archiveCodec";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class MemoryFile implements ArchiveByteReader, ArchiveByteWriter {
  private data: Uint8Array;

  constructor(initialData: Uint8Array = new Uint8Array()) {
    this.data = initialData.slice();
  }

  get size(): number {
    return this.data.byteLength;
  }

  async read(offset: number, length: number): Promise<Uint8Array> {
    if (offset < 0 || length < 0 || offset >= this.data.byteLength) {
      return new Uint8Array();
    }
    return this.data.slice(offset, Math.min(offset + length, this.data.byteLength));
  }

  async write(offset: number, bytes: Uint8Array): Promise<void> {
    const requiredSize = offset + bytes.byteLength;
    if (requiredSize > this.data.byteLength) {
      const expanded = new Uint8Array(requiredSize);
      expanded.set(this.data);
      this.data = expanded;
    }
    this.data.set(bytes, offset);
  }

  snapshot(): Uint8Array {
    return this.data.slice();
  }

  mutateByte(offset: number): void {
    const value = this.data[offset];
    if (value === undefined) {
      throw new Error(`Cannot mutate byte at ${offset}.`);
    }
    this.data[offset] = value ^ 0xff;
  }

  setUint32(offset: number, value: number): void {
    new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength).setUint32(
      offset,
      value,
      true
    );
  }
}

interface StoredManifestForTest {
  archiveVersion: number;
  kind: string;
  manifest: unknown;
  payloads: Array<{
    crc32: number;
    offset: number;
    path: string;
    size: number;
  }>;
}

describe("KidEDU archive codec", () => {
  it("matches the standard CRC32 vector and is invariant across chunks", () => {
    const input = encoder.encode("123456789");
    expect(formatCrc32(crc32(input))).toBe("cbf43926");

    const incremental = new Crc32();
    incremental.update(input.subarray(0, 2));
    incremental.update(input.subarray(2, 7));
    incremental.update(input.subarray(7));

    expect(incremental.digestHex()).toBe("cbf43926");
    expect(incremental.digest()).toBe(crc32(input));
  });

  it("round-trips Unicode JSON and streams verification and extraction in bounded chunks", async () => {
    const voice = new MemoryFile(encoder.encode("Giọng mẹ: uống nước nhé 👩‍👧"));
    const video = new MemoryFile(Uint8Array.from({ length: 25 }, (_, index) => index));
    const archiveFile = new MemoryFile();
    const progress: ArchiveProgress[] = [];
    const yieldControl = jest.fn(async () => undefined);

    const written = await writeKidEduArchive(
      archiveFile,
      [
        { path: "media/giọng-mẹ.m4a", reader: voice },
        { path: "media/mouth-video.mp4", reader: video }
      ],
      (payloads) => ({
        childName: "Bé Ánh 🌱",
        files: payloads.map(({ path, size }) => ({ path, size }))
      }),
      {
        chunkSize: 7,
        onProgress: (event) => {
          progress.push(event);
        },
        yieldControl
      }
    );

    expect(written.archiveSize).toBe(archiveFile.size);
    expect(written.payloads).toHaveLength(2);
    expect(yieldControl).toHaveBeenCalled();
    expect(progress.at(-1)).toMatchObject({
      phase: "write-manifest",
      processedBytes: written.manifestLength,
      totalBytes: written.manifestLength
    });

    const inspected = await inspectKidEduArchive(archiveFile, { chunkSize: 5 });
    expect(inspected.manifest).toEqual({
      childName: "Bé Ánh 🌱",
      files: [
        { path: "media/giọng-mẹ.m4a", size: voice.size },
        { path: "media/mouth-video.mp4", size: video.size }
      ]
    });

    await expect(
      verifyKidEduArchivePayloads(archiveFile, inspected, { chunkSize: 4 })
    ).resolves.toBeUndefined();

    const extracted = new MemoryFile();
    await expect(
      extractKidEduArchivePayload(archiveFile, inspected, "media/mouth-video.mp4", extracted, {
        chunkSize: 3
      })
    ).resolves.toMatchObject({ path: "media/mouth-video.mp4", size: video.size });
    expect(extracted.snapshot()).toEqual(video.snapshot());
  });

  it("rejects truncated archives and unsupported header versions", async () => {
    const { archiveFile } = await createArchive([{ path: "media/a.bin", text: "abc" }]);
    const truncated = new MemoryFile(archiveFile.snapshot().subarray(0, archiveFile.size - 1));

    await expectArchiveError(inspectKidEduArchive(truncated), "INVALID_FOOTER");

    const wrongVersion = new MemoryFile(archiveFile.snapshot());
    wrongVersion.setUint32(8, 2);
    await expectArchiveError(inspectKidEduArchive(wrongVersion), "UNSUPPORTED_VERSION");
  });

  it("detects a corrupted manifest before parsing its business data", async () => {
    const { archiveFile, written } = await createArchive([{ path: "media/a.bin", text: "abc" }]);
    archiveFile.mutateByte(written.manifestOffset + written.manifestLength - 1);

    await expectArchiveError(inspectKidEduArchive(archiveFile), "CHECKSUM_MISMATCH");
  });

  it("detects a corrupted payload during verification and extraction", async () => {
    const { archiveFile, written } = await createArchive([{ path: "media/a.bin", text: "abc" }]);
    const payload = written.payloads[0];
    if (!payload) {
      throw new Error("Expected a payload.");
    }
    archiveFile.mutateByte(payload.offset);

    const inspected = await inspectKidEduArchive(archiveFile);
    await expectArchiveError(
      verifyKidEduArchivePayloads(archiveFile, inspected, { chunkSize: 1 }),
      "CHECKSUM_MISMATCH"
    );
    await expectArchiveError(
      extractKidEduArchivePayload(archiveFile, inspected, payload.path, new MemoryFile(), {
        chunkSize: 1
      }),
      "CHECKSUM_MISMATCH"
    );
  });

  it("rejects payload offsets that enter the header", async () => {
    const { archiveFile, written } = await createArchive([{ path: "media/a.bin", text: "abc" }]);
    await rewriteStoredManifest(archiveFile, written, (stored) => {
      const payload = stored.payloads[0];
      if (!payload) {
        throw new Error("Expected a payload.");
      }
      payload.offset = KIDEDU_ARCHIVE_V1_LAYOUT.headerSize - 1;
    });

    await expectArchiveError(inspectKidEduArchive(archiveFile), "INVALID_PAYLOAD_RANGE");
  });

  it("rejects path traversal even when the manifest checksum is valid", async () => {
    const { archiveFile, written } = await createArchive([{ path: "media/a.bin", text: "abc" }]);
    await rewriteStoredManifest(archiveFile, written, (stored) => {
      const payload = stored.payloads[0];
      if (!payload) {
        throw new Error("Expected a payload.");
      }
      payload.path = "../evil.bin";
    });

    await expectArchiveError(inspectKidEduArchive(archiveFile), "INVALID_PAYLOAD_PATH");
  });

  it("rejects duplicate payload paths even when casing differs", async () => {
    const { archiveFile, written } = await createArchive([
      { path: "media/a.bin", text: "abc" },
      { path: "media/b.bin", text: "def" }
    ]);
    await rewriteStoredManifest(archiveFile, written, (stored) => {
      const payload = stored.payloads[1];
      if (!payload) {
        throw new Error("Expected a second payload.");
      }
      payload.path = "MEDIA/A.BIN";
    });

    await expectArchiveError(inspectKidEduArchive(archiveFile), "DUPLICATE_PAYLOAD_PATH");
  });

  it("rejects overlapping payload ranges", async () => {
    const { archiveFile, written } = await createArchive([
      { path: "media/a.bin", text: "abc" },
      { path: "media/b.bin", text: "def" }
    ]);
    await rewriteStoredManifest(archiveFile, written, (stored) => {
      const first = stored.payloads[0];
      const second = stored.payloads[1];
      if (!first || !second) {
        throw new Error("Expected two payloads.");
      }
      second.offset = first.offset;
    });

    await expectArchiveError(inspectKidEduArchive(archiveFile), "INVALID_PAYLOAD_RANGE");
  });
});

async function createArchive(
  inputs: Array<{ path: string; text: string }>
): Promise<{ archiveFile: MemoryFile; written: KidEduArchiveIndex }> {
  const archiveFile = new MemoryFile();
  const written = await writeKidEduArchive(
    archiveFile,
    inputs.map(({ path, text }) => ({ path, reader: new MemoryFile(encoder.encode(text)) })),
    () => ({ createdAt: "2026-07-20T00:00:00.000Z" }),
    { chunkSize: 2 }
  );
  return { archiveFile, written };
}

async function rewriteStoredManifest(
  archiveFile: MemoryFile,
  archive: KidEduArchiveIndex,
  mutate: (manifest: StoredManifestForTest) => void
): Promise<void> {
  const archiveBytes = archiveFile.snapshot();
  const originalManifestBytes = archiveBytes.slice(
    archive.manifestOffset,
    archive.manifestOffset + archive.manifestLength
  );
  const stored = JSON.parse(decoder.decode(originalManifestBytes)) as StoredManifestForTest;
  mutate(stored);
  const updatedManifestBytes = encoder.encode(JSON.stringify(stored));

  expect(updatedManifestBytes.byteLength).toBe(archive.manifestLength);
  await archiveFile.write(archive.manifestOffset, updatedManifestBytes);

  const footerOffset = archiveFile.size - KIDEDU_ARCHIVE_V1_LAYOUT.footerSize;
  archiveFile.setUint32(
    footerOffset + KIDEDU_ARCHIVE_V1_LAYOUT.footerManifestCrc32Offset,
    crc32(updatedManifestBytes)
  );
}

async function expectArchiveError(
  promise: Promise<unknown>,
  code: ArchiveCodecErrorCode
): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected archive error: ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(ArchiveCodecError);
    expect((error as ArchiveCodecError).code).toBe(code);
  }
}
