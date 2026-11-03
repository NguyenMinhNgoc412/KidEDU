import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AuthProvider, useAuth } from "../AuthProvider";
import type { AuthSession } from "../authGateway";
import { RequestTimeoutError } from "@/api/requestWithTimeout";

const mockGateway = {
  restore: jest.fn(),
  refresh: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  subscribe: jest.fn(() => () => undefined)
};
jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: { currentState: "active", addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
}));
jest.mock("../createAuthGateway", () => ({ createAuthGateway: () => mockGateway }));

const session: AuthSession = {
  accountId: "account-a",
  accessToken: "test-token",
  expiresAt: "2030-01-01T00:00:00.000Z"
};
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockGateway.restore.mockResolvedValue(session);
  mockGateway.signOut.mockResolvedValue(undefined);
});

test("token expiry refreshes without calling logout", async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-12T00:00:00.000Z"));
  mockGateway.restore.mockResolvedValue({ ...session, expiresAt: "2026-10-12T00:00:01.000Z" });
  mockGateway.refresh.mockResolvedValue(session);
  const view = await renderHook(useAuth, { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(mockGateway.refresh).toHaveBeenCalledTimes(1);
  expect(mockGateway.signOut).not.toHaveBeenCalled();
  expect(view.result.current.accessTokenValid).toBe(true);
  expect(view.result.current.session).toEqual(session);
  await view.unmount();
  jest.useRealTimers();
});

test("transient refresh failure preserves session, blocks expired access and permits retry", async () => {
  mockGateway.restore.mockResolvedValue({ ...session, expiresAt: "2000-01-01T00:00:00.000Z" });
  mockGateway.refresh.mockRejectedValue(new Error("network"));
  const view = await renderHook(useAuth, { wrapper });
  await waitFor(() => expect(view.result.current.error).not.toBeNull());
  expect(view.result.current.session?.accountId).toBe(session.accountId);
  expect(view.result.current.accessTokenValid).toBe(false);
  expect(mockGateway.signOut).not.toHaveBeenCalled();
  mockGateway.refresh.mockResolvedValue(session);
  await act(async () => view.result.current.refreshSession());
  expect(view.result.current.accessTokenValid).toBe(true);
  expect(view.result.current.error).toBeNull();
  await view.unmount();
});

test("an in-flight refresh cannot restore an explicitly logged-out account", async () => {
  let finish: ((next: AuthSession) => void) | undefined;
  mockGateway.refresh.mockImplementation(
    () =>
      new Promise<AuthSession>((resolve) => {
        finish = resolve;
      })
  );
  const view = await renderHook(useAuth, { wrapper });
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  let pending: Promise<void> | undefined;
  await act(() => {
    pending = view.result.current.refreshSession();
  });
  await act(async () => view.result.current.signOut());
  await act(async () => {
    finish?.(session);
    await pending;
  });
  expect(view.result.current.session).toBeNull();
  expect(view.result.current.accessTokenValid).toBe(false);
  await view.unmount();
});

test("confirmed invalid refresh credential clears session", async () => {
  mockGateway.refresh.mockResolvedValue(null);
  const view = await renderHook(useAuth, { wrapper });
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  await act(async () => view.result.current.refreshSession());
  expect(view.result.current.session).toBeNull();
  expect(mockGateway.signOut).not.toHaveBeenCalled();
  await view.unmount();
});

test("login timeout exposes a retryable error and a successful retry establishes a session", async () => {
  mockGateway.restore.mockResolvedValue(null);
  mockGateway.signIn
    .mockRejectedValueOnce(new RequestTimeoutError())
    .mockResolvedValueOnce(session);
  const view = await renderHook(useAuth, { wrapper });
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  await act(async () => {
    expect(await view.result.current.signIn("parent@local.kidedu.test", "test")).toBe(false);
  });
  expect(view.result.current.session).toBeNull();
  expect(view.result.current.error).toContain("Máy chủ chưa phản hồi");
  await act(async () => {
    expect(await view.result.current.signIn("parent@local.kidedu.test", "test")).toBe(true);
  });
  expect(view.result.current.session).toEqual(session);
  expect(view.result.current.error).toBeNull();
  await view.unmount();
});
