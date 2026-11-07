import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { isLocalFullAccess } from "../localFullAccess";
import { useParentGateStore } from "@/features/parent/parentGate";
jest.mock("@/features/lessonRuntime/fixtureBoundary", () => ({ localFixtureEnabled: jest.fn() }));
const full = "00000000-0000-4000-8000-000000000002";
afterEach(() => {
  useParentGateStore.getState().configureLocalTest();
});
it("never grants test bypass outside the guarded local fixture", () => {
  jest.mocked(localFixtureEnabled).mockReturnValue(false);
  expect(isLocalFullAccess(full)).toBe(false);
  useParentGateStore.getState().configureLocalTest(full);
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
});
it("keeps the synthetic full account unlocked and clears the exception on account switch", () => {
  jest.mocked(localFixtureEnabled).mockReturnValue(true);
  useParentGateStore.getState().configureLocalTest(full);
  useParentGateStore.getState().lock();
  expect(useParentGateStore.getState().isUnlocked).toBe(true);
  useParentGateStore.getState().configureLocalTest("another-account");
  expect(useParentGateStore.getState().localTestBypass).toBe(false);
  useParentGateStore.getState().unlock();
  useParentGateStore.getState().lock();
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
});
