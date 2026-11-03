import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { LearningAccessProvider, useLearningAccess } from "../LearningAccessProvider";

const mockSubscription = jest.fn();
let mockTokenValid = true;
jest.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    session: { accountId: "synthetic-account", accessToken: "synthetic-token" },
    accessTokenValid: mockTokenValid,
    refreshSession: jest.fn().mockResolvedValue(undefined)
  })
}));
jest.mock("@/api/localClient", () => ({
  createLocalApiClient: () => ({ getSubscription: mockSubscription })
}));
jest.mock("react-native-web/dist/exports/AppState", () => ({
  __esModule: true,
  default: { currentState: "active", addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
}));
function wrapper({ children }: { children: ReactNode }) {
  return <LearningAccessProvider>{children}</LearningAccessProvider>;
}
const initialDev = __DEV__;
const devGlobal = globalThis as typeof globalThis & { __DEV__: boolean };
beforeEach(() => {
  mockTokenValid = true;
  mockSubscription.mockReset().mockResolvedValue({
    learningAllowed: true,
    allowedCapabilities: ["learning.plan.full"],
    serverTime: new Date().toISOString(),
    accessUntil: new Date(Date.now() + 86400000).toISOString()
  });
});
afterEach(() => {
  devGlobal.__DEV__ = initialDev;
});

test("production projection alone cannot open learning", async () => {
  devGlobal.__DEV__ = false;
  const view = await renderHook(useLearningAccess, { wrapper });
  await waitFor(() => expect(view.result.current.status).toBe("locked"));
  await view.unmount();
});

test("synthetic development account can use the local test lane", async () => {
  devGlobal.__DEV__ = true;
  const view = await renderHook(useLearningAccess, { wrapper });
  await waitFor(() => expect(view.result.current.status).toBe("allowed"));
  await view.unmount();
});

test("expired token blocks access while preserving the account for recovery", async () => {
  devGlobal.__DEV__ = true;
  mockTokenValid = false;
  const view = await renderHook(useLearningAccess, { wrapper });
  expect(view.result.current.status).toBe("error");
  expect(mockSubscription).not.toHaveBeenCalled();
  await view.unmount();
});
