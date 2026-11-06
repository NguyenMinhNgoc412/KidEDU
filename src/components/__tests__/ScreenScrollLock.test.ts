import { act, renderHook } from "@testing-library/react-native";
import { useScreenScrollLockController } from "../ScreenScrollLock";

test("a held gesture locks scrolling synchronously and its release restores it", async () => {
  const native = jest.fn();
  const hook = await renderHook(() => useScreenScrollLockController(native));
  let release!: () => void;
  await act(async () => {
    release = hook.result.current.acquire();
    expect(native).toHaveBeenLastCalledWith(true);
  });
  expect(hook.result.current.locked).toBe(true);
  await act(async () => release());
  expect(hook.result.current.locked).toBe(false);
  expect(native).toHaveBeenLastCalledWith(false);
  await hook.unmount();
});

test("duplicate or stale cleanup cannot unlock another active drag", async () => {
  const native = jest.fn();
  const hook = await renderHook(() => useScreenScrollLockController(native));
  let first!: () => void, second!: () => void;
  await act(async () => {
    first = hook.result.current.acquire();
    second = hook.result.current.acquire();
  });
  await act(async () => {
    first();
    first();
  });
  expect(hook.result.current.locked).toBe(true);
  expect(native.mock.calls).toEqual([[true]]);
  await act(async () => second());
  expect(hook.result.current.locked).toBe(false);
  expect(native.mock.calls).toEqual([[true], [false]]);
  await hook.unmount();
});

test("cleanup after the screen unmounts neither updates native props nor starts a new lock", async () => {
  const native = jest.fn();
  const hook = await renderHook(() => useScreenScrollLockController(native));
  const acquire = hook.result.current.acquire;
  let release!: () => void;
  await act(async () => {
    release = acquire();
  });
  await hook.unmount();
  release();
  acquire()();
  expect(native.mock.calls).toEqual([[true]]);
});
