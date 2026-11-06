import { fireEvent, render } from "@testing-library/react-native";
import { ChildTabBar } from "../ChildTabBar";
import { useParentGateStore } from "@/features/parent/parentGate";

const mockReplace = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

beforeEach(() => {
  mockReplace.mockReset();
  mockPathname = "/";
  useParentGateStore.getState().lock();
});

it("announces four tabs and requires the parent gate when entering the parent area", async () => {
  const screen = await render(<ChildTabBar active="speech" />);
  expect(screen.getAllByRole("tab")).toHaveLength(4);
  expect(screen.getByRole("tab", { name: "Tập nói" })).toBeSelected();
  useParentGateStore.getState().unlock();
  await fireEvent.press(screen.getByRole("tab", { name: "Phụ huynh" }));
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
  expect(mockReplace).toHaveBeenCalledWith("/parent-gate");
});

it("locks the parent area when leaving it for collection", async () => {
  mockPathname = "/parent";
  useParentGateStore.getState().unlock();
  const screen = await render(<ChildTabBar active="parent" />);
  await fireEvent.press(screen.getByRole("tab", { name: "Bộ sưu tập" }));
  expect(useParentGateStore.getState().isUnlocked).toBe(false);
  expect(mockReplace).toHaveBeenCalledWith("/collection");
});

it("returns from guided practice to the speech root even though its tab is selected", async () => {
  mockPathname = "/practice";
  const screen = await render(<ChildTabBar active="speech" />);
  await fireEvent.press(screen.getByRole("tab", { name: "Tập nói" }));
  expect(mockReplace).toHaveBeenCalledWith("/");
});
