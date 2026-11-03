const mockOpenDatabaseAsync = jest.fn(async (name: string) => ({
  name,
  execAsync: jest.fn(),
  closeAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task())
}));

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: (name: string) => mockOpenDatabaseAsync(name)
}));
jest.mock("@/data/migrations", () => ({ migrateKidEduDatabase: jest.fn() }));
jest.mock("@/data/seedDatabase", () => ({ seedKidEduDatabaseInTransaction: jest.fn() }));

import { closeKidEduDatabase, openKidEduDatabase } from "../database";

test("each internal account opens a separate database and legacy data stays unassigned", async () => {
  const first = "11111111-1111-4111-8111-111111111111";
  const second = "22222222-2222-4222-8222-222222222222";
  const firstDatabase = await openKidEduDatabase(first);
  expect(await openKidEduDatabase(first)).toBe(firstDatabase);
  expect(await openKidEduDatabase(second)).not.toBe(firstDatabase);
  expect(mockOpenDatabaseAsync.mock.calls.map(([name]) => name)).toEqual([
    `kidedu-${first}.db`,
    `kidedu-${second}.db`
  ]);
  expect(() => openKidEduDatabase("../kidedu.db")).toThrow("Invalid account namespace");
  await closeKidEduDatabase(first);
  expect(firstDatabase.closeAsync).toHaveBeenCalledTimes(1);
  expect(await openKidEduDatabase(first)).not.toBe(firstDatabase);
});
