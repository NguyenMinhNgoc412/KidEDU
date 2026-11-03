import { scheduleAccessExpiry } from "../scheduleAccessExpiry";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("a 30-day subscription stays open past the maximum timer delay and expires once", () => {
  const expire = jest.fn();
  const duration = 30 * 24 * 60 * 60 * 1000;
  scheduleAccessExpiry(duration, expire);
  jest.advanceTimersByTime(2_147_483_647);
  expect(expire).not.toHaveBeenCalled();
  jest.advanceTimersByTime(duration - 2_147_483_647 - 1);
  expect(expire).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(expire).toHaveBeenCalledTimes(1);
});

test("wall-clock rollback does not extend access", () => {
  const expire = jest.fn();
  scheduleAccessExpiry(1000, expire);
  jest.setSystemTime(new Date("2000-01-01"));
  jest.advanceTimersByTime(1000);
  expect(expire).toHaveBeenCalledTimes(1);
});

test("account cleanup cancels expiry even after a long-duration timer chunk", () => {
  const expire = jest.fn();
  const cancel = scheduleAccessExpiry(3_000_000_000, expire);
  jest.advanceTimersByTime(2_147_483_647);
  cancel();
  jest.advanceTimersByTime(3_000_000_000);
  expect(expire).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test.each([0, -1, NaN, Infinity])("invalid or elapsed duration %s fails closed", (duration) => {
  const expire = jest.fn();
  scheduleAccessExpiry(duration, expire);
  expect(expire).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
