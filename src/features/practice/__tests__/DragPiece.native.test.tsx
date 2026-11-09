import { act, render } from "@testing-library/react-native";
import { Animated } from "react-native";
import type {
  GestureResponderEvent,
  PanResponderCallbacks,
  PanResponderGestureState
} from "react-native";
import { DragPiece } from "../DragPiece";
let mockHandlers: PanResponderCallbacks;
const mockMeasure = jest.fn();
jest.mock("react-native", () => {
  const React = jest.requireActual("react");
  const actual = jest.requireActual("react-native");
  const mocked = Object.create(actual);
  const animated = Object.create(actual.Animated);
  Object.defineProperty(animated, "View", {
    value: React.forwardRef((props: object, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({ measureInWindow: mockMeasure }));
      return React.createElement(actual.View, props);
    })
  });
  Object.defineProperty(mocked, "__esModule", { value: true });
  Object.defineProperty(mocked, "Animated", { value: animated });
  Object.defineProperty(mocked, "PanResponder", {
    value: {
      ...actual.PanResponder,
      create: (handlers: PanResponderCallbacks) => {
        mockHandlers = handlers;
        return { panHandlers: {} };
      }
    }
  });
  return mocked;
});
const event = { nativeEvent: { pageX: 290, pageY: 330 } } as GestureResponderEvent;
const movement = { dx: 100, dy: 40, moveX: 0, moveY: 0 } as PanResponderGestureState;
beforeEach(() => {
  mockMeasure.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it("holds translation until the resting bounds arrive, including a release before measurement", async () => {
  let callback!: (x: number, y: number, width: number, height: number) => void;
  mockMeasure.mockImplementation((value) => {
    callback = value;
  });
  const onDrop = jest.fn().mockResolvedValue(true);
  const position = jest.spyOn(Animated.ValueXY.prototype, "setValue");
  const screen = await render(
    <DragPiece id="ball" label="Bóng" disabled={false} onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  jest.useFakeTimers();
  await act(async () => {
    mockHandlers.onPanResponderGrant?.(event, movement);
  });
  const before = position.mock.calls.length;
  await act(async () => {
    mockHandlers.onPanResponderMove?.(event, movement);
    mockHandlers.onPanResponderRelease?.(event, movement);
  });
  expect(position.mock.calls.length).toBe(before);
  expect(onDrop).not.toHaveBeenCalled();
  await act(async () => {
    callback(100, 200, 100, 100);
  });
  expect(onDrop).toHaveBeenCalledWith("ball", 250, 290);
  await screen.unmount();
});
it("releases safely if the native measurement never responds", async () => {
  const onDrop = jest.fn().mockResolvedValue(false);
  const screen = await render(
    <DragPiece id="ball" label="Bóng" disabled={false} onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  jest.useFakeTimers();
  await act(async () => {
    mockHandlers.onPanResponderGrant?.(event, movement);
    mockHandlers.onPanResponderRelease?.(event, movement);
    jest.advanceTimersByTime(120);
  });
  expect(onDrop).toHaveBeenCalledWith("ball", 290, 330);
  await screen.unmount();
});
it("drops by the translated picture center even when the finger is beyond the destination", async () => {
  mockMeasure.mockImplementation((callback) => callback(100, 200, 100, 100));
  const onDrop = jest.fn().mockResolvedValue(true);
  const screen = await render(
    <DragPiece id="ball" label="Bóng" disabled={false} onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  await act(async () => {
    mockHandlers.onPanResponderGrant?.(event, movement);
    mockHandlers.onPanResponderRelease?.(event, movement);
  });
  expect(onDrop).toHaveBeenCalledWith("ball", 250, 290);
  await screen.unmount();
});
it("uses release page coordinates if native measurement is unavailable, not stale moveX/moveY zeroes", async () => {
  mockMeasure.mockImplementation((callback) => callback(0, 0, 0, 0));
  const onDrop = jest.fn().mockResolvedValue(false);
  const screen = await render(
    <DragPiece id="ball" label="Bóng" disabled={false} onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  await act(async () => {
    mockHandlers.onPanResponderGrant?.(event, movement);
    mockHandlers.onPanResponderRelease?.(event, movement);
  });
  expect(onDrop).toHaveBeenCalledWith("ball", 290, 330);
  await screen.unmount();
});

it("does not accept a release after input was disabled mid-drag", async () => {
  mockMeasure.mockImplementation((callback) => callback(100, 200, 100, 100));
  const onDrop = jest.fn().mockResolvedValue(true);
  const screen = await render(
    <DragPiece id="ball" label="Bóng" disabled={false} onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  await act(async () => {
    mockHandlers.onPanResponderGrant?.(event, movement);
  });
  await screen.rerender(
    <DragPiece id="ball" label="Bóng" disabled onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  await act(async () => {
    mockHandlers.onPanResponderRelease?.(event, movement);
  });
  expect(onDrop).not.toHaveBeenCalled();
  await screen.unmount();
});
it("ignores stale source measurements after a gesture is cancelled", async () => {
  const callbacks: Array<(x: number, y: number, width: number, height: number) => void> = [];
  mockMeasure.mockImplementation((callback) => callbacks.push(callback));
  const onDrop = jest.fn().mockResolvedValue(true);
  const screen = await render(
    <DragPiece id="ball" label="Bóng" disabled={false} onDrop={onDrop}>
      {null}
    </DragPiece>
  );
  await act(async () => {
    mockHandlers.onPanResponderGrant?.(event, movement);
    mockHandlers.onPanResponderTerminate?.(event, movement);
    mockHandlers.onPanResponderGrant?.(event, movement);
    callbacks[1]!(100, 200, 100, 100);
    callbacks[0]!(900, 900, 100, 100);
    mockHandlers.onPanResponderRelease?.(event, movement);
  });
  expect(onDrop).toHaveBeenCalledWith("ball", 250, 290);
  await screen.unmount();
});
