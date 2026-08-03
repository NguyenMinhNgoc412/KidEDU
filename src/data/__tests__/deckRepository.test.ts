import type { KidEduDatabase } from "@/data/database";
import { SQLiteKidEduRepository } from "@/data/repository";
import type { EntityStatus } from "@/data/types";

interface DeckRecord {
  id: string;
  title: string;
  description: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

interface DeckItemRecord {
  id: string;
  deck_id: string;
  learning_item_id: string;
  sort_order: number;
}

interface LearningItemRecord {
  id: string;
  status: EntityStatus;
}

class FakeDeckDetailDatabase {
  readonly detailQueries: string[] = [];

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (!sql.includes("FROM decks")) {
      throw new Error(`Unexpected first query: ${sql}`);
    }

    return {
      id: "deck-1",
      title: "Gia dinh",
      description: null,
      status: "active",
      item_count: 2
    } as T;
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    if (sql.includes("FROM learning_item_media")) {
      return [];
    }

    if (!sql.includes("FROM deck_items")) {
      throw new Error(`Unexpected query: ${sql}`);
    }

    this.detailQueries.push(sql);
    const excludesArchived = sql.includes("li.status != 'archived'");
    const items = [
      {
        id: "item-active",
        title: "Ba",
        category_id: "cat-family",
        category_name: "Gia dinh",
        status: "active",
        learning_status: "new",
        note: null
      },
      {
        id: "item-hidden",
        title: "Me",
        category_id: "cat-family",
        category_name: "Gia dinh",
        status: "hidden",
        learning_status: "new",
        note: null
      },
      {
        id: "item-archived",
        title: "Ong",
        category_id: "cat-family",
        category_name: "Gia dinh",
        status: "archived",
        learning_status: "new",
        note: null
      }
    ];

    return items.filter((item) => !excludesArchived || item.status !== "archived") as T[];
  }
}

class FakeDeckDatabase {
  private readonly decks: DeckRecord[] = [];
  private readonly deckItems: DeckItemRecord[] = [];

  constructor(private readonly learningItems: LearningItemRecord[]) {}

  async getAllAsync<T>(sql: string): Promise<T[]> {
    if (!sql.includes("FROM decks")) {
      throw new Error(`Unexpected query: ${sql}`);
    }

    const excludesArchived = sql.includes("d.status != 'archived'");
    const childOnly = sql.includes("d.status = 'active'");
    const rows = this.decks
      .filter((deck) => (!excludesArchived || deck.status !== "archived") && (!childOnly || deck.status === "active"))
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .map((deck) => ({
        id: deck.id,
        title: deck.title,
        description: deck.description,
        status: deck.status,
        item_count: this.deckItems.filter(
          (deckItem) =>
            deckItem.deck_id === deck.id &&
            this.learningItems.some((item) => item.id === deckItem.learning_item_id && item.status === "active")
        ).length
      }));

    return rows as T[];
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    const normalizedSql = sql.replace(/\s+/g, " ").trim();

    if (normalizedSql.startsWith("INSERT INTO decks")) {
      const [id, title, description, createdAt, updatedAt] = params as [string, string, string | null, string, string];
      this.decks.push({ id, title, description, status: "active", created_at: createdAt, updated_at: updatedAt });
      return;
    }

    if (normalizedSql.startsWith("DELETE FROM deck_items WHERE deck_id")) {
      const [deckId] = params as [string];
      for (let index = this.deckItems.length - 1; index >= 0; index -= 1) {
        if (this.deckItems[index]?.deck_id === deckId) {
          this.deckItems.splice(index, 1);
        }
      }
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO deck_items")) {
      const [id, deckId, learningItemId, sortOrder] = params as [string, string, string, number];
      this.deckItems.push({ id, deck_id: deckId, learning_item_id: learningItemId, sort_order: sortOrder });
      return;
    }

    throw new Error(`Unexpected mutation: ${sql}`);
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    await callback();
  }
}

describe("SQLiteKidEduRepository decks", () => {
  it("keeps hidden items in deck detail so parent edits do not remove them", async () => {
    const db = new FakeDeckDetailDatabase();
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    const detail = await repository.getDeckDetail("deck-1");

    expect(detail?.items.map((item) => ({ id: item.id, status: item.status }))).toEqual([
      { id: "item-active", status: "active" },
      { id: "item-hidden", status: "hidden" }
    ]);
    expect(db.detailQueries[0]).toContain("li.status != 'archived'");
  });

  it("lists a newly created active deck for the child learning screen", async () => {
    const db = new FakeDeckDatabase([{ id: "item-text-only", status: "active" }]);
    const repository = new SQLiteKidEduRepository(db as unknown as KidEduDatabase);

    const deckId = await repository.createDeck({
      title: "Bo moi cua con",
      description: null,
      itemIds: ["item-text-only"]
    });

    await expect(repository.listDecks({ includeArchived: false, childOnly: true })).resolves.toEqual([
      {
        id: deckId,
        title: "Bo moi cua con",
        description: null,
        status: "active",
        itemCount: 1
      }
    ]);
  });
});
