import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useLocalBackend } from "../useLocalBackend";

const mockGetMe = jest.fn();
const mockGetSubscription = jest.fn();
const mockListChildren = jest.fn();

jest.mock("@/api/localClient", () => ({
  ApiRequestError: class ApiRequestError extends Error {},
  createLocalApiClient: () => ({
    getMe: (...args: unknown[]) => mockGetMe(...args),
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    listChildren: (...args: unknown[]) => mockListChildren(...args)
  })
}));

describe("local backend account isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMe.mockResolvedValue({ id: "account-1" });
    mockGetSubscription.mockResolvedValue({ state: "none", learningAllowed: false });
    mockListChildren.mockResolvedValue([{ id: "child-1", displayName: "Test Child", version: 1 }]);
  });

  it("clears child and subscription data when JWT or API URL changes", async () => {
    const { result } = await renderHook(() => useLocalBackend());
    await act(async () => {
      result.current.changeToken("test-token");
    });
    await act(async () => {
      await result.current.connect();
    });
    await waitFor(() => expect(result.current.children).toHaveLength(1));
    expect(result.current.subscription?.learningAllowed).toBe(false);

    await act(async () => {
      result.current.changeToken("another-token");
    });
    expect(result.current.accountId).toBeNull();
    expect(result.current.subscription).toBeNull();
    expect(result.current.children).toEqual([]);

    await act(async () => {
      await result.current.connect();
    });
    await act(async () => {
      result.current.setUrl("http://127.0.0.1:3001");
    });
    expect(result.current.accountId).toBeNull();
    expect(result.current.children).toEqual([]);
  });
});
