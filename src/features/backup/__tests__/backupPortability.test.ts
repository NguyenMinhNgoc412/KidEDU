import type { BackupDatabaseSnapshot, BackupMediaAssetRow } from "@/data/backupSnapshot";
import {
  createPortableBackupPlan,
  createRestoredDatabaseSnapshot
} from "@/features/backup/backupPortability";

const now = "2026-07-20T08:00:00.000Z";

describe("backup media portability", () => {
  it("removes device file URIs, deduplicates payloads and preserves bundled assets", () => {
    const snapshot = makeSnapshot([
      makeAsset("default", "default", "bundle://default/me-mouth"),
      makeAsset("video", "custom", "file:///media/shared.mp4"),
      makeAsset("video-copy", "generated", "file:///media/shared.mp4"),
      makeAsset("missing", "custom", "file:///media/not-found.m4a")
    ]);

    const plan = createPortableBackupPlan(snapshot, (asset) =>
      asset.uri.endsWith("shared.mp4") ? { uri: asset.uri, size: 1_024 } : null
    );

    expect(plan.files).toEqual([
      { path: "media/000001.mp4", size: 1_024, sourceUri: "file:///media/shared.mp4" }
    ]);
    expect(plan.totalMediaBytes).toBe(1_024);
    expect(plan.data.media_assets.map((asset) => asset.storage)).toEqual([
      { kind: "bundle", uri: "bundle://default/me-mouth" },
      { kind: "archive", path: "media/000001.mp4" },
      { kind: "archive", path: "media/000001.mp4" },
      { kind: "missing" }
    ]);
    expect(JSON.stringify(plan.data)).not.toContain("file:///media/");
    expect(plan.data.media_assets[3]).toEqual(
      expect.objectContaining({ size_bytes: null, status: "missing" })
    );
  });

  it("maps archive paths to new durable URIs and never restores the source-device path", () => {
    const plan = createPortableBackupPlan(
      makeSnapshot([
        makeAsset("video", "custom", "file:///old/device.mp4"),
        makeAsset("default", "default", "bundle://default/me-mouth"),
        makeAsset("missing", "custom", "content://unavailable")
      ]),
      (asset) => (asset.id === "video" ? { uri: asset.uri, size: 12 } : null)
    );

    const restored = createRestoredDatabaseSnapshot(
      plan.data,
      new Map([["media/000001.mp4", "file:///new/restore/000001.mp4"]])
    );

    expect(restored.media_assets.map((asset) => asset.uri)).toEqual([
      "file:///new/restore/000001.mp4",
      "bundle://default/me-mouth",
      "missing://backup/missing"
    ]);
    expect(JSON.stringify(restored)).not.toContain("file:///old/");
  });

  it("fails before the database write when an extracted path is absent", () => {
    const plan = createPortableBackupPlan(
      makeSnapshot([makeAsset("video", "custom", "file:///old/video.mp4")]),
      (asset) => ({ uri: asset.uri, size: 12 })
    );

    expect(() => createRestoredDatabaseSnapshot(plan.data, new Map())).toThrow(
      "Restored media path is missing"
    );
  });
});

function makeSnapshot(mediaAssets: BackupMediaAssetRow[]): BackupDatabaseSnapshot {
  return {
    schemaVersion: 1,
    createdAt: now,
    children: [],
    categories: [],
    learning_items: [],
    media_assets: mediaAssets,
    learning_item_media: [],
    decks: [],
    deck_items: [],
    practice_sessions: [],
    practice_events: [],
    learning_progress: [],
    settings: []
  };
}

function makeAsset(
  id: string,
  source: BackupMediaAssetRow["source"],
  uri: string
): BackupMediaAssetRow {
  return {
    id,
    type: id === "missing" ? "audio" : "video",
    source,
    uri,
    thumbnail_asset_id: null,
    duration_ms: null,
    size_bytes: 999,
    mime_type: id === "missing" ? "audio/m4a" : "video/mp4",
    status: "active",
    created_at: now,
    updated_at: now
  };
}
