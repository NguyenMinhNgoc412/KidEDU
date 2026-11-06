import { act, renderHook } from "@testing-library/react-native";
import type { ComponentRef } from "react";
import type { View } from "react-native";
import { useDropTargets } from "../useDropTargets";

test("drop outside the target or rejected by its rule leaves the source unassigned", async () => {
  const accept = jest.fn(() => false);
  const hook = await renderHook(() => useDropTargets(false, accept));
  hook.result.current.targets.current.slot = {
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
      callback(10, 20, 80, 80)
  } as ComponentRef<typeof View>;
  expect(await hook.result.current.drop("fish", 5, 5)).toBe(false);
  expect(accept).not.toHaveBeenCalled();
  expect(await hook.result.current.drop("fish", 40, 40)).toBe(false);
  expect(accept).toHaveBeenCalledWith("fish", "slot");
  await hook.unmount();
});

test("pause while native measurement is pending cannot assign a piece", async () => {
  let measured: ((x: number, y: number, w: number, h: number) => void) | undefined;
  const accept = jest.fn(() => true);
  let paused = false;
  const hook = await renderHook(() => useDropTargets(paused, accept));
  hook.result.current.targets.current.slot = {
    measureInWindow: (callback: typeof measured) => {
      measured = callback;
    }
  } as ComponentRef<typeof View>;
  const pending = hook.result.current.drop("fish", 40, 40);
  paused = true;
  await hook.rerender(undefined);
  await act(async () => {
    measured!(10, 20, 80, 80);
  });
  expect(await pending).toBe(false);
  expect(accept).not.toHaveBeenCalled();
  await hook.unmount();
});

test("valid hit is committed once, and unmounted boards reject stale callbacks", async () => {
  const accept = jest.fn(() => true);
  const hook = await renderHook(() => useDropTargets(false, accept));
  hook.result.current.targets.current.slot = {
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
      callback(0, 0, 80, 80)
  } as ComponentRef<typeof View>;
  expect(await hook.result.current.drop("fish", 40, 40)).toBe(true);
  expect(accept).toHaveBeenCalledTimes(1);
  const stale = hook.result.current.drop;
  await hook.unmount();
  expect(await stale("fish", 40, 40)).toBe(false);
  expect(accept).toHaveBeenCalledTimes(1);
});
