import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { ChildProfilesScreen } from "../ChildProfilesScreen";
import { ApiRequestError } from "@/api/localClient";

const child = {
  id: "child",
  displayName: "Hồ sơ minh họa",
  version: 2,
  familyId: "family",
  gender: null
};
const mockProfiles = {
  children: [child],
  selected: child,
  save: jest.fn(),
  refresh: jest.fn(),
  select: jest.fn(),
  loading: false,
  error: false
};
jest.mock("../useChildProfiles", () => ({ useChildProfiles: () => mockProfiles }));
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("@/components/Screen", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Screen: ({ children }: { children: ReactNode }) => React.createElement(View, null, children)
  };
});
beforeEach(() => {
  jest.clearAllMocks();
  mockProfiles.save.mockResolvedValue(child);
});
it("requires an explicit gender and sends the displayed profile version with the edit", async () => {
  const screen = await render(<ChildProfilesScreen />);
  const save = screen.getByRole("button", { name: "Lưu hồ sơ" });
  expect(save).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Bé gái" }));
  expect(save).toBeEnabled();
  await fireEvent.press(save);
  expect(mockProfiles.save).toHaveBeenCalledWith(child, child.displayName, "girl");
});
it("requires a deliberate reload after another device changes the profile", async () => {
  mockProfiles.save.mockRejectedValue(new ApiRequestError(409, "CONFLICT"));
  const screen = await render(<ChildProfilesScreen />);
  await fireEvent.press(screen.getByRole("button", { name: "Bé trai" }));
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Lưu hồ sơ" })));
  expect(screen.queryByRole("button", { name: "Lưu hồ sơ" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Tải hồ sơ mới nhất" }));
  expect(mockProfiles.refresh).toHaveBeenCalledTimes(1);
});
