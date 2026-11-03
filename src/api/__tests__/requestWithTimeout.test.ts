import { requestWithTimeout, RequestTimeoutError } from "../requestWithTimeout";

afterEach(() => jest.useRealTimers());

test("bounds an unresponsive request and aborts its network work", async () => {
  jest.useFakeTimers();
  let signal: AbortSignal | undefined;
  const pending = requestWithTimeout((next) => {
    signal = next;
    return new Promise<never>(() => undefined);
  });
  const rejected = expect(pending).rejects.toBeInstanceOf(RequestTimeoutError);
  await jest.advanceTimersByTimeAsync(15_000);
  await rejected;
  expect(signal?.aborted).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});

test("clears its timer on success and preserves request failures", async () => {
  jest.useFakeTimers();
  await expect(requestWithTimeout(async () => "done")).resolves.toBe("done");
  const error = new Error("INVALID_CREDENTIALS");
  await expect(
    requestWithTimeout(async () => {
      throw error;
    })
  ).rejects.toBe(error);
  expect(jest.getTimerCount()).toBe(0);
});

test("a response after timeout cannot complete a timed-out login", async () => {
  jest.useFakeTimers();
  let finish: ((value: string) => void) | undefined;
  const pending = requestWithTimeout(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      })
  );
  const rejected = expect(pending).rejects.toBeInstanceOf(RequestTimeoutError);
  await jest.advanceTimersByTimeAsync(15_000);
  await rejected;
  finish?.("late response");
  await expect(pending).rejects.toBeInstanceOf(RequestTimeoutError);
});
