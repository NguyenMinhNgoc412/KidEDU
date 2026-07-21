import type { KidEduDatabase } from "@/data/database";
import { SQLiteKidEduRepository } from "@/data/repository";
import type {
  EntityStatus,
  LearningStatus,
  MediaRole,
  MediaSource,
  MediaStatus,
  MediaType
} from "@/data/types";

interface LearningItemRecord {
  id: string;
  title: string;
  category_id: string;
  category_name: string;
  status: EntityStatus;
  learning_status: LearningStatus;
  note: string | null;
}

interface MediaRecord {
  id: string;
  learning_item_id: string;
  media_asset_id: string;
  role: MediaRole;
  priority: number;
  is_active: number;
  asset_id: string;
  type: MediaType;
  source: MediaSource;
  uri: string;
  thumbnail_asset_id: string | null;
  thumbnail_uri: string | null;
  duration_ms: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  asset_status: MediaStatus;
}

interface MediaCleanupRecord {
  asset_id: string;
  uri: string;
  status: MediaStatus;
  is_referenced_by_active_media: number;
}

class FakeLearningItemDatabase {
  cleanupQuerySql: string | null = null;
  mediaQueryCount = 0;
  mediaQueryParams: unknown[][] = [];
  runCalls: Array<{ sql: string; params: unknown[] }> = [];

  constructor(
    private readonly learningItems: LearningItemRecord[],
    private readonly mediaRows: MediaRecord[],
    private readonly cleanupRows: MediaCleanupRecord[] = []
  ) {}

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (sql.includes("FROM learning_items li")) {
      return this.learningItems as T[];
    }

    if (sql.includes("FROM media_assets ma") && sql.includes("is_referenced_by_active_media")) {
      this.cleanupQuerySql = sql;
      return this.cleanupRows as T[];
    }

    if (sql.includes("FROM learning_item_media lim")) {
      this.mediaQueryCount += 1;
      this.mediaQueryParams.push(params);
      const itemIds = new Set(params);

      return this.mediaRows
        .filter((row) => itemIds.has(row.learning_item_id) && row.is_active === 1)
        .sort(
          (left, right) =>
            left.learning_item_id.localeCompare(right.learning_item_id) ||
            left.role.localeCompare(right.role) ||
            right.priority - left.priority
        ) as T[];
    }

    throw new Error(`Unexpected query: ${sql}`);
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    this.runCalls.push({ sql, params });
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
  }
}

describe("SQLiteKidEduRepository learning item list", () => {
  it("batch loads media for listed words instead of querying per item", async () => {
    const db = new FakeLearningItemDatabase(
      [makeLearningItemRow("item-1", "ba"), makeLearningItemRow("item-2", "mẹ")],
      [
        makeMediaRow("item-1", "illustration", "seed://item-1/illustration"),
        makeMediaRow("item-1", "mouth_video", "seed://item-1/mouth_video"),
        makeMediaRow("item-2", "illustration", "seed://item-2/illustration")
      ]
    );
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    const items = await repository.listLearningItems({ includeArchived: false });

    expect(db.mediaQueryCount).toBe(1);
    expect(db.mediaQueryParams).toEqual([["item-1", "item-2"]]);

    const firstItem = items.find((item) => item.id === "item-1")!;
    const secondItem = items.find((item) => item.id === "item-2")!;

    expect(firstItem.media.map((media) => media.role)).toEqual(["illustration", "mouth_video"]);
    expect(secondItem.media.map((media) => media.role)).toEqual(["illustration"]);
  });

  it("does not query media when the word list is empty", async () => {
    const db = new FakeLearningItemDatabase([], []);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.listLearningItems({ includeArchived: false })).resolves.toEqual([]);
    expect(db.mediaQueryCount).toBe(0);
  });

  it("maps media cleanup rows and preserves active-reference flags", async () => {
    const db = new FakeLearningItemDatabase(
      [],
      [],
      [
        makeCleanupRow("media-video", "file:///media/videos/custom/a.mp4", "active", 1),
        makeCleanupRow("media-old", "file:///media/videos/custom/old.mp4", "deleted", 0)
      ]
    );
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await expect(repository.listMediaFilesForCleanup()).resolves.toEqual([
      {
        assetId: "media-video",
        uri: "file:///media/videos/custom/a.mp4",
        status: "active",
        isReferencedByActiveMedia: true
      },
      {
        assetId: "media-old",
        uri: "file:///media/videos/custom/old.mp4",
        status: "deleted",
        isReferencedByActiveMedia: false
      }
    ]);
    expect(db.cleanupQuerySql).toContain("c.avatar_asset_id = ma.id");
    expect(db.cleanupQuerySql).toContain("avatar.thumbnail_asset_id = ma.id");
  });

  it("updates missing cleanup records only from active media assets", async () => {
    const db = new FakeLearningItemDatabase([], []);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await repository.markMediaAssetsMissing(["media-a", "media-a", "media-b"]);

    expect(db.runCalls).toHaveLength(1);
    expect(db.runCalls[0]?.sql).toContain("AND status = 'active'");
    expect(db.runCalls[0]?.params[0]).toBe("missing");
    expect(db.runCalls[0]?.params.slice(2)).toEqual(["media-a", "media-b"]);
  });

  it("archives an item and deactivates only its unshared custom media mappings", async () => {
    const db = new FakeLearningItemDatabase([], []);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    await repository.archiveLearningItem("item-1");

    expect(db.runCalls).toHaveLength(5);
    expect(db.runCalls[0]?.sql).toContain("UPDATE learning_items SET status = 'archived'");
    expect(db.runCalls[1]?.sql).toContain("DELETE FROM deck_items");

    const deactivateMappingCall = db.runCalls[2];
    expect(deactivateMappingCall?.sql).toContain("SET is_active = 0");
    expect(deactivateMappingCall?.sql).toContain("ma.source = 'custom'");
    expect(deactivateMappingCall?.params).toEqual(["item-1"]);

    const deleteAssetCall = db.runCalls[3];
    expect(deleteAssetCall?.sql).toContain("active_lim.media_asset_id = media_assets.id");
    expect(deleteAssetCall?.sql).toContain("active_lim.is_active = 1");
    expect(deleteAssetCall?.sql).toContain("ma.source = 'custom'");

    const deleteThumbnailCall = db.runCalls[4];
    expect(deleteThumbnailCall?.sql).toContain("active_asset.thumbnail_asset_id = media_assets.id");
    expect(deleteThumbnailCall?.sql).toContain("active_lim.is_active = 1");
    expect(db.runCalls.slice(2).every((call) => !call.sql.includes("ma.source = 'default'"))).toBe(
      true
    );
  });
});

function makeLearningItemRow(id: string, title: string): LearningItemRecord {
  return {
    id,
    title,
    category_id: "cat-family",
    category_name: "Gia đình",
    status: "active",
    learning_status: "new",
    note: null
  };
}

function makeMediaRow(itemId: string, role: MediaRole, uri: string): MediaRecord {
  const assetId = `media-${itemId}-${role}`;

  return {
    id: `map-${itemId}-${role}`,
    learning_item_id: itemId,
    media_asset_id: assetId,
    role,
    priority: 10,
    is_active: 1,
    asset_id: assetId,
    type: role === "mouth_video" ? "video" : "image",
    source: "default",
    uri,
    thumbnail_asset_id: null,
    thumbnail_uri: null,
    duration_ms: null,
    size_bytes: null,
    mime_type: null,
    asset_status: "active"
  };
}

function makeCleanupRow(
  assetId: string,
  uri: string,
  status: MediaStatus,
  isReferencedByActiveMedia: number
): MediaCleanupRecord {
  return {
    asset_id: assetId,
    uri,
    status,
    is_referenced_by_active_media: isReferencedByActiveMedia
  };
}
