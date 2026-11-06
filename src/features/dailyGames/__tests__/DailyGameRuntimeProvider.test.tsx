import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { DailyGameRuntimeProvider, useDailyGameRepository } from "../DailyGameRuntimeProvider";

const accountA = "11111111-1111-4111-8111-111111111111";
const accountB = "22222222-2222-4222-8222-222222222222";
let mockAccountId: string | null = null;
const mockOpen = jest.fn();
const mockInitialize = jest.fn();
const mockRepositories: { accountId: string; close: jest.Mock }[] = [];
jest.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: mockAccountId ? { accountId: mockAccountId } : null })
}));
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: (...args: unknown[]) => mockOpen(...args) }));
jest.mock("../localRepository", () => ({
  DailyGameLocalRepository: jest.fn().mockImplementation((_db: unknown, accountId: string) => {
    const repository = {
      accountId,
      initialize: () => mockInitialize(accountId),
      close: jest.fn(async () => undefined)
    };
    mockRepositories.push(repository);
    return repository;
  })
}));
const database = () => ({
  execAsync: jest.fn(async () => undefined),
  closeAsync: jest.fn(async () => undefined)
});
const wrapper = ({ children }: { children: ReactNode }) => (
  <DailyGameRuntimeProvider>{children}</DailyGameRuntimeProvider>
);
beforeEach(() => {
  mockAccountId = null;
  mockRepositories.length = 0;
  mockOpen.mockReset();
  mockInitialize.mockReset().mockResolvedValue(undefined);
});

it("opens an account-specific database and closes the previous namespace on account switch/sign-out", async () => {
  const a = database(),
    b = database();
  mockOpen.mockResolvedValueOnce(a).mockResolvedValueOnce(b);
  const screen = await renderHook(() => useDailyGameRepository(), { wrapper });
  expect(mockOpen).not.toHaveBeenCalled();
  mockAccountId = accountA;
  await screen.rerender(undefined);
  await waitFor(() => expect(screen.result.current.repository?.accountId).toBe(accountA));
  expect(mockOpen).toHaveBeenNthCalledWith(1, `daily-games-${accountA}.db`);
  const old = screen.result.current.repository;
  mockAccountId = accountB;
  await screen.rerender(undefined);
  expect(screen.result.current.repository).not.toBe(old);
  await waitFor(() => expect(screen.result.current.repository?.accountId).toBe(accountB));
  await waitFor(() => expect(a.closeAsync).toHaveBeenCalledTimes(1));
  expect(mockRepositories.find((repo) => repo.accountId === accountA)!.close).toHaveBeenCalledTimes(
    1
  );
  mockAccountId = null;
  await screen.rerender(undefined);
  expect(screen.result.current.repository).toBeNull();
  await waitFor(() => expect(b.closeAsync).toHaveBeenCalledTimes(1));
});

it("closes a late database/open failure for account A without publishing its error or handle into account B", async () => {
  const a = database(),
    b = database();
  let resolve!: (value: ReturnType<typeof database>) => void;
  mockOpen
    .mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    )
    .mockResolvedValueOnce(b);
  mockInitialize.mockImplementation(async (accountId: string) => {
    if (accountId === accountA) throw new Error("OLD_NAMESPACE_INIT_FAILURE");
  });
  mockAccountId = accountA;
  const screen = await renderHook(() => useDailyGameRepository(), { wrapper });
  mockAccountId = accountB;
  await screen.rerender(undefined);
  await waitFor(() => expect(screen.result.current.repository?.accountId).toBe(accountB));
  await act(async () => resolve(a));
  await waitFor(() => expect(a.closeAsync).toHaveBeenCalledTimes(1));
  expect(screen.result.current.repository?.accountId).toBe(accountB);
  expect(screen.result.current.error).toBe(false);
});

it("closes SQLite immediately on initialization failure and never publishes the unusable repository", async () => {
  const a = database();
  mockOpen.mockResolvedValue(a);
  mockInitialize.mockRejectedValue(new Error("DISK_FAILURE"));
  mockAccountId = accountA;
  const screen = await renderHook(() => useDailyGameRepository(), { wrapper });
  await waitFor(() => expect(screen.result.current.error).toBe(true));
  expect(screen.result.current.repository).toBeNull();
  expect(screen.result.current.runtime).toBeNull();
  await waitFor(() => expect(a.closeAsync).toHaveBeenCalledTimes(1));
});

it("still closes the database when namespace cleanup reports an error", async () => {
  const a = database();
  mockOpen.mockResolvedValue(a);
  mockAccountId = accountA;
  const screen = await renderHook(() => useDailyGameRepository(), { wrapper });
  await waitFor(() => expect(screen.result.current.repository?.accountId).toBe(accountA));
  mockRepositories[0]!.close.mockRejectedValueOnce(new Error("CLEANUP_FAILURE"));
  mockAccountId = null;
  await screen.rerender(undefined);
  await waitFor(() => expect(a.closeAsync).toHaveBeenCalledTimes(1));
  expect(screen.result.current.repository).toBeNull();
});
