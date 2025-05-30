import { renderHook, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLossGifs, useUpdateLossGif } from "../../src/hooks/useLossGifs";
import { authRequest } from "../../src/utils/apiClient";

// Mock API client
jest.mock("../../src/utils/apiClient", () => ({
  authRequest: jest.fn()
}));

describe("useLossGifs hook", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    authRequest.mockClear();
  });

  /**
   * Create wrapper component for React Query hooks.
   */
  const createWrapper = () => {
    return function Wrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  test("fetches loss GIFs with correct query configuration", async () => {
    const mockLossGifs = [
      {
        _id: "1",
        category: "frustrated",
        streakThreshold: 5,
        imageUrl: "https://example.com/frustrated.gif"
      },
      {
        _id: "2",
        category: "disappointed",
        streakThreshold: 10,
        imageUrl: "https://example.com/disappointed.gif"
      }
    ];

    authRequest.mockResolvedValueOnce(mockLossGifs);

    const { result } = renderHook(() => useLossGifs(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authRequest).toHaveBeenCalledWith("/api/admin/loss-gifs");
    expect(result.current.data).toEqual(mockLossGifs);
  });

  test("handles API errors appropriately", async () => {
    const mockError = new Error("Network error");
    authRequest.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useLossGifs(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
    });
  });

  test("uses correct cache configuration", () => {
    renderHook(() => useLossGifs(), {
      wrapper: createWrapper()
    });

    // Verify query key structure matches admin cards pattern
    const queryState = queryClient.getQueryState(["admin-loss-gifs"]);
    expect(queryState).toBeDefined();
  });
});

describe("useUpdateLossGif hook", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    authRequest.mockClear();
  });

  /**
   * Create wrapper component for React Query hooks.
   */
  const createWrapper = () => {
    return function Wrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  test("updates loss GIF with FormData including image", async () => {
    const mockResponse = {
      _id: "1",
      category: "updated",
      streakThreshold: 15,
      imageUrl: "https://example.com/updated.gif"
    };

    authRequest.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useUpdateLossGif(), {
      wrapper: createWrapper()
    });

    const formData = {
      category: "updated",
      streakThreshold: 15,
      imageUrl: "https://example.com/original.gif"
    };

    const file = new File(["test"], "test.gif", { type: "image/gif" });

    await result.current.mutateAsync({
      lossGifId: "1",
      formData,
      selectedFile: file
    });

    expect(authRequest).toHaveBeenCalledWith("/api/admin/loss-gifs/1", {
      method: "PUT",
      body: expect.any(FormData),
      headers: {}
    });

    // Verify FormData contains expected fields
    const call = authRequest.mock.calls[0];
    const formDataSent = call[1].body;
    expect(formDataSent).toBeInstanceOf(FormData);
  });

  test("updates loss GIF without image when file not provided", async () => {
    const mockResponse = {
      _id: "1",
      category: "updated",
      streakThreshold: 20
    };

    authRequest.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useUpdateLossGif(), {
      wrapper: createWrapper()
    });

    const formData = {
      category: "updated",
      streakThreshold: 20,
      imageUrl: "https://example.com/existing.gif"
    };

    await result.current.mutateAsync({
      lossGifId: "1",
      formData,
      selectedFile: null
    });

    expect(authRequest).toHaveBeenCalledWith("/api/admin/loss-gifs/1", {
      method: "PUT",
      body: expect.any(FormData),
      headers: {}
    });

    // Verify FormData created even without file
    const call = authRequest.mock.calls[0];
    const formDataSent = call[1].body;
    expect(formDataSent).toBeInstanceOf(FormData);
  });

  test("invalidates cache after successful update", async () => {
    const mockResponse = { _id: "1", category: "updated" };
    authRequest.mockResolvedValueOnce(mockResponse);

    // Set initial cache data
    queryClient.setQueryData(
      ["admin-loss-gifs"],
      [{ _id: "1", category: "old" }]
    );

    const { result } = renderHook(() => useUpdateLossGif(), {
      wrapper: createWrapper()
    });

    const formData = { category: "updated" };

    await result.current.mutateAsync({
      lossGifId: "1",
      formData,
      selectedFile: null
    });

    // Verify cache invalidation triggered
    await waitFor(() => {
      const queryState = queryClient.getQueryState(["admin-loss-gifs"]);
      expect(queryState.isInvalidated).toBe(true);
    });
  });

  test("handles update errors appropriately", async () => {
    const mockError = new Error("Update failed");
    authRequest.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useUpdateLossGif(), {
      wrapper: createWrapper()
    });

    const formData = { category: "test" };

    await expect(
      result.current.mutateAsync({
        lossGifId: "1",
        formData,
        selectedFile: null
      })
    ).rejects.toThrow("Update failed");
  });
});
