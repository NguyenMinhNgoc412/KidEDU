import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths, type FileHandle } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { BackupMediaAssetRow } from "@/data/backupSnapshot";
import type { KidEduRepository } from "@/data/types";
import { cleanupMediaFiles } from "@/features/media/mediaImportService";

import {
  ArchiveCodecError,
  type ArchiveByteReader,
  type ArchiveByteWriter,
  type ArchivePayloadDescriptor,
  type ArchivePayloadSource,
  extractKidEduArchivePayload,
  formatCrc32,
  inspectKidEduArchive,
  type KidEduArchiveIndex,
  verifyKidEduArchivePayloads,
  writeKidEduArchive
} from "./archiveCodec";
import {
  type BackupArchiveFileDescriptor,
  BackupManifestError,
  createKidEduBackupCounts,
  type KidEduBackupManifest,
  kidEduBackupExtension,
  kidEduBackupFormat,
  kidEduBackupFormatVersion,
  kidEduBackupManifestMaxBytes,
  kidEduBackupMimeType,
  type PortableBackupDatabaseSnapshot,
  validateKidEduBackupManifest
} from "./backupManifest";
import { createPortableBackupPlan, createRestoredDatabaseSnapshot } from "./backupPortability";

const backupDiskHeadroomBytes = 32 * 1024 * 1024;
const backupMaxMediaBytes = 8 * 1024 * 1024 * 1024;
const backupMaxPayloadCount = 10_000;
const chunksPerUiYield = 8;

export type BackupStage =
  | "preparing_data"
  | "packing_media"
  | "verifying_backup"
  | "opening_share"
  | "selecting_file"
  | "checking_backup"
  | "restoring_media"
  | "restoring_data"
  | "cleaning_up";

export interface LocalBackupPreview {
  appVersion: string;
  createdAt: string;
  learningItemCount: number;
  deckCount: number;
  mediaAssetCount: number;
  mediaFileCount: number;
  totalMediaBytes: number;
  practiceSessionCount: number;
  integrityChecked: boolean;
}

export interface CreatedLocalBackup {
  fileName: string;
  uri: string;
  preview: LocalBackupPreview;
}

export interface PreparedLocalRestore {
  fileName: string;
  sourceUri: string;
  archive: KidEduArchiveIndex;
  manifest: KidEduBackupManifest;
  preview: LocalBackupPreview;
}

export type BackupServiceErrorCode =
  | "creation_failed"
  | "incompatible_version"
  | "invalid_file"
  | "not_enough_space"
  | "restore_failed"
  | "share_failed"
  | "share_unavailable"
  | "unsupported_platform";

export class BackupServiceError extends Error {
  constructor(
    readonly code: BackupServiceErrorCode,
    message: string,
    readonly originalError?: unknown
  ) {
    super(message);
    this.name = "BackupServiceError";
  }
}

export async function createLocalBackup(
  repository: KidEduRepository,
  options?: { onStage?: (stage: BackupStage) => void }
): Promise<CreatedLocalBackup> {
  assertNativeBackupSupport();
  options?.onStage?.("preparing_data");

  let outputFile: File | null = null;
  try {
    const snapshot = await repository.createBackupSnapshot();
    const plan = createPortableBackupPlan(snapshot, getReadableLocalFile);
    assertPayloadBudget(plan.totalMediaBytes, "creation_failed");
    assertAvailableDiskSpace(plan.totalMediaBytes);

    const backupDirectory = ensureDirectory(new Directory(Paths.cache, "kidedu", "backups"));
    const fileName = makeBackupFileName(snapshot.createdAt);
    outputFile = new File(backupDirectory, fileName);
    outputFile.create();

    options?.onStage?.("packing_media");
    const writer = new NativeArchiveFileWriter(outputFile);
    const readers: NativeArchiveFileReader[] = [];
    let archive: KidEduArchiveIndex;

    try {
      const sources: ArchivePayloadSource[] = plan.files.map((file) => {
        const reader = new NativeArchiveFileReader(new File(file.sourceUri));
        readers.push(reader);
        return { path: file.path, reader };
      });

      archive = await writeKidEduArchive(
        writer,
        sources,
        (payloads) => createManifest(snapshot.createdAt, plan.data, payloads),
        createArchiveOptions()
      );
    } finally {
      writer.close();
      readers.forEach((reader) => reader.close());
    }

    options?.onStage?.("verifying_backup");
    const verificationReader = new NativeArchiveFileReader(outputFile);
    let manifest: KidEduBackupManifest;
    try {
      const inspected = await inspectKidEduArchive(verificationReader, createArchiveOptions());
      manifest = validateKidEduBackupManifest(inspected.manifest);
      assertManifestMatchesArchive(manifest, inspected);
      await verifyKidEduArchivePayloads(verificationReader, inspected, createArchiveOptions());

      if (inspected.archiveSize !== archive.archiveSize) {
        throw new ArchiveCodecError("ARCHIVE_CHANGED", "Archive size changed after creation.");
      }
    } finally {
      verificationReader.close();
    }

    return {
      fileName,
      uri: outputFile.uri,
      preview: createPreview(manifest, true)
    };
  } catch (error) {
    if (outputFile) {
      safeDeleteFile(outputFile.uri);
    }
    throw normalizeBackupError(error, "creation_failed");
  }
}

export async function shareLocalBackup(
  backup: CreatedLocalBackup,
  options?: { onStage?: (stage: BackupStage) => void }
): Promise<void> {
  assertNativeBackupSupport();
  options?.onStage?.("opening_share");

  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new BackupServiceError(
        "share_unavailable",
        "Thiết bị này chưa có ứng dụng phù hợp để lưu hoặc chia sẻ tệp sao lưu."
      );
    }

    await Sharing.shareAsync(backup.uri, {
      dialogTitle: "Lưu bản sao KidEDU",
      mimeType: kidEduBackupMimeType,
      UTI: "public.data"
    });
  } catch (error) {
    if (error instanceof BackupServiceError) {
      throw error;
    }
    throw new BackupServiceError(
      "share_failed",
      "Bản sao đã tạo nhưng chưa mở được bảng lưu hoặc chia sẻ.",
      error
    );
  }
}

export async function pickAndPrepareLocalRestore(options?: {
  onStage?: (stage: BackupStage) => void;
}): Promise<PreparedLocalRestore | null> {
  assertNativeBackupSupport();
  options?.onStage?.("selecting_file");

  const result = await DocumentPicker.getDocumentAsync({
    base64: false,
    copyToCacheDirectory: true,
    multiple: false,
    type: "*/*"
  });
  if (result.canceled) {
    return null;
  }

  const picked = result.assets[0];
  if (!picked) {
    return null;
  }

  const sourceFile = new File(picked.uri);
  try {
    options?.onStage?.("checking_backup");
    const reader = new NativeArchiveFileReader(sourceFile);
    try {
      const archive = await inspectKidEduArchive(reader, createArchiveOptions());
      const manifest = validateKidEduBackupManifest(archive.manifest);
      assertManifestMatchesArchive(manifest, archive);
      assertPayloadBudget(manifest.totalMediaBytes, "invalid_file");
      await verifyKidEduArchivePayloads(reader, archive, createArchiveOptions());
      assertAvailableDiskSpace(manifest.totalMediaBytes);

      return {
        fileName: picked.name,
        sourceUri: sourceFile.uri,
        archive,
        manifest,
        preview: createPreview(manifest, true)
      };
    } finally {
      reader.close();
    }
  } catch (error) {
    safeDeleteFile(sourceFile.uri);
    throw normalizeBackupError(error, "invalid_file");
  }
}

export async function restorePreparedLocalBackup(
  repository: KidEduRepository,
  prepared: PreparedLocalRestore,
  options?: { onStage?: (stage: BackupStage) => void }
): Promise<void> {
  assertNativeBackupSupport();
  assertAvailableDiskSpace(prepared.manifest.totalMediaBytes);

  const restoreDirectory = ensureDirectory(
    new Directory(Paths.document, "media", "restores", makeOperationId("restore"))
  );
  const restoredUris = new Map<string, string>();
  let databaseCommitted = false;
  const reader = new NativeArchiveFileReader(new File(prepared.sourceUri));

  try {
    options?.onStage?.("restoring_media");
    for (const file of prepared.manifest.files) {
      const destination = new File(restoreDirectory, getArchiveFileName(file.path));
      destination.create();
      const writer = new NativeArchiveFileWriter(destination);
      try {
        await extractKidEduArchivePayload(
          reader,
          prepared.archive,
          file.path,
          writer,
          createArchiveOptions()
        );
      } finally {
        writer.close();
      }
      restoredUris.set(file.path, destination.uri);
    }

    const restoredSnapshot = createRestoredDatabaseSnapshot(prepared.manifest.data, restoredUris);
    options?.onStage?.("restoring_data");
    const previousMediaUris = await repository.replaceFromBackup(restoredSnapshot);
    databaseCommitted = true;

    options?.onStage?.("cleaning_up");
    const nextUris = new Set(restoredUris.values());
    await cleanupMediaFiles(previousMediaUris.filter((uri) => !nextUris.has(uri)));
  } catch (error) {
    if (!databaseCommitted) {
      safeDeleteDirectory(restoreDirectory);
    }
    throw normalizeBackupError(error, "restore_failed");
  } finally {
    reader.close();
  }
}

export function discardCreatedLocalBackup(backup: CreatedLocalBackup | null | undefined): void {
  if (backup) {
    safeDeleteFile(backup.uri);
  }
}

export function discardPreparedLocalRestore(
  prepared: PreparedLocalRestore | null | undefined
): void {
  if (prepared) {
    safeDeleteFile(prepared.sourceUri);
  }
}

function createManifest(
  createdAt: string,
  data: PortableBackupDatabaseSnapshot,
  payloads: readonly ArchivePayloadDescriptor[]
): KidEduBackupManifest {
  const files = payloads.map(toManifestFile);
  const manifest: KidEduBackupManifest = {
    format: kidEduBackupFormat,
    formatVersion: kidEduBackupFormatVersion,
    appVersion: Constants.expoConfig?.version ?? "unknown",
    createdAt,
    counts: createKidEduBackupCounts(data, files),
    totalMediaBytes: files.reduce((total, file) => total + file.size, 0),
    files,
    data
  };

  return validateKidEduBackupManifest(manifest);
}

function assertManifestMatchesArchive(
  manifest: KidEduBackupManifest,
  archive: KidEduArchiveIndex
): void {
  if (manifest.files.length !== archive.payloads.length) {
    throw new BackupManifestError("invalid_file", "Backup payload count does not match.");
  }

  const payloadByPath = new Map(archive.payloads.map((payload) => [payload.path, payload]));
  for (const file of manifest.files) {
    const payload = payloadByPath.get(file.path);
    if (
      !payload ||
      file.offset !== payload.offset ||
      file.size !== payload.size ||
      file.checksum.value !== formatCrc32(payload.crc32)
    ) {
      throw new BackupManifestError(
        "invalid_file",
        `Backup payload metadata does not match: ${file.path}`
      );
    }
  }
}

function toManifestFile(payload: ArchivePayloadDescriptor): BackupArchiveFileDescriptor {
  return {
    path: payload.path,
    offset: payload.offset,
    size: payload.size,
    checksum: { algorithm: "crc32", value: formatCrc32(payload.crc32) }
  };
}

function createPreview(
  manifest: KidEduBackupManifest,
  integrityChecked: boolean
): LocalBackupPreview {
  return {
    appVersion: manifest.appVersion,
    createdAt: manifest.createdAt,
    learningItemCount: manifest.counts.learningItems,
    deckCount: manifest.counts.decks,
    mediaAssetCount: manifest.counts.mediaAssets,
    mediaFileCount: manifest.counts.mediaFiles,
    totalMediaBytes: manifest.totalMediaBytes,
    practiceSessionCount: manifest.counts.practiceSessions,
    integrityChecked
  };
}

function getReadableLocalFile(asset: BackupMediaAssetRow): { size: number; uri: string } | null {
  if (!asset.uri.startsWith("file://")) {
    return null;
  }

  try {
    const file = new File(asset.uri);
    return file.exists && Number.isSafeInteger(file.size) && file.size >= 0
      ? { size: file.size, uri: file.uri }
      : null;
  } catch {
    return null;
  }
}

function getArchiveFileName(path: string): string {
  const name = path.slice("media/".length);
  if (!name || name.includes("/") || name.includes("\\")) {
    throw new BackupManifestError("invalid_file", `Invalid restore file path: ${path}`);
  }
  return name;
}

function createArchiveOptions() {
  let chunksSinceYield = 0;
  return {
    maxManifestBytes: kidEduBackupManifestMaxBytes,
    maxPayloadCount: backupMaxPayloadCount,
    async yieldControl() {
      chunksSinceYield += 1;
      if (chunksSinceYield >= chunksPerUiYield) {
        chunksSinceYield = 0;
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
  };
}

function assertPayloadBudget(
  totalMediaBytes: number,
  fallbackCode: "creation_failed" | "invalid_file"
): void {
  if (
    !Number.isSafeInteger(totalMediaBytes) ||
    totalMediaBytes < 0 ||
    totalMediaBytes > backupMaxMediaBytes
  ) {
    throw new BackupServiceError(
      fallbackCode,
      "Bản sao vượt quá giới hạn dung lượng KidEDU có thể xử lý an toàn."
    );
  }
}

function assertAvailableDiskSpace(requiredPayloadBytes: number): void {
  const required = requiredPayloadBytes + backupDiskHeadroomBytes;
  const available = Paths.availableDiskSpace;
  if (Number.isFinite(available) && available < required) {
    throw new BackupServiceError(
      "not_enough_space",
      "Thiết bị không đủ dung lượng trống để hoàn tất thao tác này."
    );
  }
}

function assertNativeBackupSupport(): void {
  if (Platform.OS === "web") {
    throw new BackupServiceError(
      "unsupported_platform",
      "Sao lưu và khôi phục tệp hiện chỉ hỗ trợ trên Android và iOS."
    );
  }
}

function normalizeBackupError(
  error: unknown,
  fallbackCode: "creation_failed" | "invalid_file" | "restore_failed"
): BackupServiceError {
  if (error instanceof BackupServiceError) {
    return error;
  }

  if (error instanceof BackupManifestError) {
    return new BackupServiceError(
      error.code === "incompatible_version" ? "incompatible_version" : "invalid_file",
      error.code === "incompatible_version"
        ? "Tệp được tạo bằng phiên bản KidEDU không tương thích."
        : "Tệp sao lưu bị hỏng, chưa tải xong hoặc không phải của KidEDU.",
      error
    );
  }

  if (error instanceof ArchiveCodecError) {
    return new BackupServiceError(
      error.code === "UNSUPPORTED_VERSION" ? "incompatible_version" : "invalid_file",
      error.code === "UNSUPPORTED_VERSION"
        ? "Tệp được tạo bằng phiên bản KidEDU không tương thích."
        : "Tệp sao lưu bị hỏng, chưa tải xong hoặc không phải của KidEDU.",
      error
    );
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("space") || message.includes("enospc") || message.includes("disk full")) {
    return new BackupServiceError(
      "not_enough_space",
      "Thiết bị không đủ dung lượng trống để hoàn tất thao tác này.",
      error
    );
  }

  const messages: Record<typeof fallbackCode, string> = {
    creation_failed: "Chưa tạo được bản sao lưu. Dữ liệu hiện tại không bị thay đổi.",
    invalid_file: "Tệp sao lưu bị hỏng, chưa tải xong hoặc không phải của KidEDU.",
    restore_failed: "Khôi phục chưa thành công. Dữ liệu hiện tại không bị thay đổi."
  };
  return new BackupServiceError(fallbackCode, messages[fallbackCode], error);
}

function makeBackupFileName(createdAt: string): string {
  const stamp = createdAt.replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  return `KidEDU-${stamp}${kidEduBackupExtension}`;
}

function makeOperationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureDirectory(directory: Directory): Directory {
  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }
  return directory;
}

function safeDeleteFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Cache cleanup is best effort.
  }
}

function safeDeleteDirectory(directory: Directory): void {
  try {
    if (directory.exists) {
      directory.delete();
    }
  } catch {
    // A failed rollback cleanup must not hide the original restore error.
  }
}

class NativeArchiveFileReader implements ArchiveByteReader {
  readonly size: number;
  private handle: FileHandle | null = null;

  constructor(private readonly file: File) {
    if (!file.exists || !Number.isSafeInteger(file.size) || file.size < 0) {
      throw new BackupServiceError("invalid_file", "Không đọc được tệp sao lưu hoặc media.");
    }
    this.size = file.size;
  }

  async read(offset: number, length: number): Promise<Uint8Array> {
    try {
      this.handle ??= this.file.open();
      this.handle.offset = offset;
      const bytes = this.handle.readBytes(length);
      if (offset + bytes.byteLength >= this.size) {
        this.close();
      }
      return bytes;
    } catch (error) {
      this.close();
      throw error;
    }
  }

  close(): void {
    try {
      this.handle?.close();
    } finally {
      this.handle = null;
    }
  }
}

class NativeArchiveFileWriter implements ArchiveByteWriter {
  private handle: FileHandle | null;

  constructor(file: File) {
    this.handle = file.open();
  }

  async write(offset: number, bytes: Uint8Array): Promise<void> {
    if (!this.handle) {
      throw new Error("Cannot write to a closed KidEDU archive file.");
    }
    this.handle.offset = offset;
    this.handle.writeBytes(bytes);
  }

  close(): void {
    try {
      this.handle?.close();
    } finally {
      this.handle = null;
    }
  }
}
