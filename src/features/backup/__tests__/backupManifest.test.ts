import {
  createKidEduBackupCounts,
  type BackupManifestError,
  type KidEduBackupManifest,
  validateKidEduBackupManifest
} from "@/features/backup/backupManifest";

const createdAt = "2026-07-20T08:00:00.000Z";

describe("KidEDU backup manifest", () => {
  it("accepts a portable v1 snapshot with consistent references and counts", () => {
    const manifest = makeManifest();

    expect(validateKidEduBackupManifest(manifest)).toEqual(manifest);
  });

  it.each(["puzzle_game", "memory_game"] as const)(
    "accepts %s sessions in portable backups",
    (mode) => {
      const manifest = makeManifest();
      manifest.data.practice_sessions[0]!.mode = mode;

      expect(validateKidEduBackupManifest(manifest)).toEqual(manifest);
    }
  );

  it("reports a newer format as incompatible instead of corrupt", () => {
    const manifest: Record<string, unknown> = { ...makeManifest(), formatVersion: 2 };

    expect(() => validateKidEduBackupManifest(manifest)).toThrow(
      expect.objectContaining<Partial<BackupManifestError>>({ code: "incompatible_version" })
    );
  });

  it("rejects archive paths that could escape the restore directory", () => {
    const manifest = makeManifest();
    manifest.files[0]!.path = "media/../private.mp4";
    const asset = manifest.data.media_assets[0]!;
    asset.storage = { kind: "archive", path: "media/../private.mp4" };

    expect(() => validateKidEduBackupManifest(manifest)).toThrow(
      expect.objectContaining<Partial<BackupManifestError>>({ code: "invalid_file" })
    );
  });

  it("rejects missing foreign-key references before the database transaction", () => {
    const manifest = makeManifest();
    manifest.data.deck_items[0]!.learning_item_id = "item-unknown";

    expect(() => validateKidEduBackupManifest(manifest)).toThrow("missing reference");
  });

  it("rejects count or byte totals that do not match the payload list", () => {
    const manifest = makeManifest();
    manifest.counts.mediaFiles += 1;

    expect(() => validateKidEduBackupManifest(manifest)).toThrow("count does not match");

    const byteMismatch = makeManifest();
    byteMismatch.totalMediaBytes += 1;
    expect(() => validateKidEduBackupManifest(byteMismatch)).toThrow("byte count does not match");
  });

  it("rejects a bundled URI on custom media", () => {
    const manifest = makeManifest();
    manifest.data.media_assets[0]!.storage = {
      kind: "bundle",
      uri: "bundle://default/example"
    };

    expect(() => validateKidEduBackupManifest(manifest)).toThrow("invalid bundled storage");
  });
});

function makeManifest(): KidEduBackupManifest {
  const files = [
    {
      path: "media/000001.mp4",
      offset: 16,
      size: 4,
      checksum: { algorithm: "crc32" as const, value: "9be3e0a3" }
    }
  ];
  const data: KidEduBackupManifest["data"] = {
    schemaVersion: 1,
    createdAt,
    children: [
      {
        id: "child-default",
        name: "Con",
        avatar_asset_id: null,
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    categories: [{ id: "cat-family", name: "Gia đình", sort_order: 1, is_default: 1 }],
    learning_items: [
      {
        id: "item-me",
        title: "Mẹ",
        category_id: "cat-family",
        status: "active",
        learning_status: "practicing",
        note: null,
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    media_assets: [
      {
        id: "media-custom",
        type: "video",
        source: "custom",
        storage: { kind: "archive", path: "media/000001.mp4" },
        thumbnail_asset_id: null,
        duration_ms: 1_000,
        size_bytes: 4,
        mime_type: "video/mp4",
        status: "active",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    learning_item_media: [
      {
        id: "mapping-1",
        learning_item_id: "item-me",
        media_asset_id: "media-custom",
        role: "mouth_video",
        priority: 100,
        is_active: 1,
        puzzle_template_key: null,
        created_at: createdAt
      }
    ],
    decks: [
      {
        id: "deck-family",
        title: "Gia đình",
        description: null,
        status: "active",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    deck_items: [
      { id: "deck-item-1", deck_id: "deck-family", learning_item_id: "item-me", sort_order: 1 }
    ],
    practice_sessions: [
      {
        id: "session-1",
        child_id: "child-default",
        mode: "auto_play_deck",
        deck_id: "deck-family",
        started_at: createdAt,
        ended_at: createdAt,
        status: "interrupted"
      }
    ],
    practice_events: [
      {
        id: "event-1",
        session_id: "session-1",
        learning_item_id: "item-me",
        event_type: "viewed",
        created_at: createdAt
      }
    ],
    learning_progress: [
      {
        id: "progress-1",
        child_id: "child-default",
        learning_item_id: "item-me",
        view_count: 1,
        practice_count: 0,
        last_practiced_at: createdAt,
        parent_mark: "practicing"
      }
    ],
    settings: [{ key: "speed_preset", value: "normal", updated_at: createdAt }]
  };

  return {
    format: "kidedu-local-backup",
    formatVersion: 1,
    appVersion: "0.1.0",
    createdAt,
    counts: createKidEduBackupCounts(data, files),
    totalMediaBytes: 4,
    files,
    data
  };
}
