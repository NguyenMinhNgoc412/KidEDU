import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLegacyCollection } from "../useLegacyCollection";

let mockAccount = "account-a";
const mockCheckpoints = jest.fn();
const mockCollection = jest.fn();
jest.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    session: { accountId: mockAccount, accessToken: "synthetic" },
    accessTokenValid: true
  })
}));
jest.mock("@/api/localClient", () => ({
  createLocalApiClient: () => ({ getPracticeCheckpoints: mockCheckpoints })
}));
jest.mock("@/features/lessonRuntime/LessonRuntimeProvider", () => ({
  useLessonRuntimeRepository: () => ({ repository: { stickerCollection: mockCollection } })
}));

it("reads owned rewards without catalog/subscription APIs and isolates a late account response", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  mockCheckpoints.mockResolvedValueOnce({ stickers: ["owned-a"] });
  mockCollection.mockResolvedValue(["local-a", "owned-a"]);
  const screen = await renderHook(
    (props: { childId: string }) => useLegacyCollection(props.childId),
    {
      initialProps: { childId: "child-a" },
      wrapper
    }
  );
  await waitFor(() => expect(screen.result.current.stickers).toEqual(["owned-a", "local-a"]));
  let resolveOld!: (value: { stickers: string[] }) => void;
  mockCheckpoints.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveOld = resolve;
    })
  );
  await act(async () => screen.result.current.refresh());
  mockAccount = "account-b";
  mockCheckpoints.mockResolvedValueOnce({ stickers: ["owned-b"] });
  mockCollection.mockResolvedValue([]);
  await screen.rerender({ childId: "child-b" });
  await waitFor(() => expect(screen.result.current.stickers).toEqual(["owned-b"]));
  await act(async () => resolveOld({ stickers: ["late-owned-a"] }));
  expect(screen.result.current.stickers).toEqual(["owned-b"]);
  await screen.unmount();
  client.clear();
});
