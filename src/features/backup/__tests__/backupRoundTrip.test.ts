import type { BackupDatabaseSnapshot } from "@/data/backupSnapshot";
import {
  type ArchiveByteReader,
  type ArchiveByteWriter,
  formatCrc32,
  inspectKidEduArchive,
  verifyKidEduArchivePayloads,
  writeKidEduArchive,
  extractKidEduArchivePayload
} from "@/features/backup/archiveCodec";
import {
  createKidEduBackupCounts,
  type KidEduBackupManifest,
  validateKidEduBackupManifest
} from "@/features/backup/backupManifest";
import {
  createPortableBackupPlan,
  createRestoredDatabaseSnapshot
} from "@/features/backup/backupPortability";

const now = "2026-07-20T08:00:00.000Z";

describe("KidEDU local backup round trip", () => {
  it("moves metadata and media to a new URI without serializing the old device path", async () => {
    const payloadBytes = new Uint8Array([0, 1, 2, 3, 254, 255]);
    const oldUri = "file:///old-device/media/me.mp4";
    const plan = createPortableBackupPlan(makeSnapshot(oldUri, payloadBytes.length), (asset) => ({
      uri: asset.uri,
      size: payloadBytes.length
    }));
    const archiveFile = new MemoryFile();

    await writeKidEduArchive(
      archiveFile,
      [{ path: plan.files[0]!.path, reader: new MemoryFile(payloadBytes) }],
      (payloads) => {
        const files = payloads.map((payload) => ({
          path: payload.path,
          offset: payload.offset,
          size: payload.size,
          checksum: { algorithm: "crc32" as const, value: formatCrc32(payload.crc32) }
        }));
        const manifest: KidEduBackupManifest = {
          format: "kidedu-local-backup",
          formatVersion: 1,
          appVersion: "0.1.0",
          createdAt: now,
          counts: createKidEduBackupCounts(plan.data, files),
          totalMediaBytes: payloadBytes.length,
          files,
          data: plan.data
        };
        return validateKidEduBackupManifest(manifest);
      }
    );

    expect(new TextDecoder().decode(archiveFile.bytes)).not.toContain(oldUri);

    const inspected = await inspectKidEduArchive(archiveFile);
    const restoredManifest = validateKidEduBackupManifest(inspected.manifest);
    await verifyKidEduArchivePayloads(archiveFile, inspected);
    const extracted = new MemoryFile();
    await extractKidEduArchivePayload(
      archiveFile,
      inspected,
      restoredManifest.files[0]!.path,
      extracted
    );

    const newUri = "file:///new-device/media/restores/me.mp4";
    const restored = createRestoredDatabaseSnapshot(
      restoredManifest.data,
      new Map([[restoredManifest.files[0]!.path, newUri]])
    );

    expect(extracted.bytes).toEqual(payloadBytes);
    expect(restored.media_assets[0]!.uri).toBe(newUri);
    expect(JSON.stringify(restored)).not.toContain(oldUri);
  });
});

class MemoryFile implements ArchiveByteReader, ArchiveByteWriter {
  private data: Uint8Array;

  constructor(initial = new Uint8Array()) {
    this.data = initial.slice();
  }

  get size(): number {
    return this.data.byteLength;
  }

  get bytes(): Uint8Array {
    return this.data.slice();
  }

  async read(offset: number, length: number): Promise<Uint8Array> {
    return this.data.slice(offset, offset + length);
  }

  async write(offset: number, bytes: Uint8Array): Promise<void> {
    const nextSize = Math.max(this.data.byteLength, offset + bytes.byteLength);
    const next = new Uint8Array(nextSize);
    next.set(this.data);
    next.set(bytes, offset);
    this.data = next;
  }
}

function makeSnapshot(uri: string, size: number): BackupDatabaseSnapshot {
  return {
    schemaVersion: 1,
    createdAt: now,
    children: [
      {
        id: "child-default",
        name: "Con",
        avatar_asset_id: null,
        created_at: now,
        updated_at: now
      }
    ],
    categories: [{ id: "cat-family", name: "Gia đình", sort_order: 1, is_default: 1 }],
    learning_items: [
      {
        id: "item-me",
        title: "Mẹ",
        category_id: "cat-family",
        status: "active",
        learning_status: "new",
        note: null,
        created_at: now,
        updated_at: now
      }
    ],
    media_assets: [
      {
        id: "media-me",
        type: "video",
        source: "custom",
        uri,
        thumbnail_asset_id: null,
        duration_ms: 1_000,
        size_bytes: size,
        mime_type: "video/mp4",
        status: "active",
        created_at: now,
        updated_at: now
      }
    ],
    learning_item_media: [
      {
        id: "mapping-me",
        learning_item_id: "item-me",
        media_asset_id: "media-me",
        role: "mouth_video",
        priority: 100,
        is_active: 1,
        puzzle_template_key: null,
        created_at: now
      }
    ],
    decks: [],
    deck_items: [],
    practice_sessions: [],
    practice_events: [],
    learning_progress: [],
    settings: []
  };
}
