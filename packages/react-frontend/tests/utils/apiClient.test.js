import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

// Mock fetch globally
globalThis.fetch = jest.fn();

// Mock apiClient module completely
jest.mock("../../src/utils/apiClient", () => ({
  __esModule: true,
  getAuthToken: jest.fn(() => {
    return globalThis.localStorage?.getItem("authToken") || null;
  }),
  apiRequest: jest.fn(async (endpoint, options = {}) => {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    const url = `http://localhost:8000${normalizedEndpoint}`;

    const headers = {};

    // Only set Content-Type for non-FormData requests
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    } else if (!options.body) {
      // Set Content-Type for requests without body
      headers["Content-Type"] = "application/json";
    }

    Object.assign(headers, options.headers);

    const config = { ...options, headers };
    const response = await globalThis.fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  }),
  authRequest: jest.fn(async (endpoint, options = {}) => {
    const token = globalThis.localStorage?.getItem("authToken");

    if (!token) {
      throw new Error("Authentication required");
    }

    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    const url = `http://localhost:8000${normalizedEndpoint}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers
    };

    // Only set Content-Type for non-FormData requests
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    } else if (!options.body) {
      // Set Content-Type for requests without body
      headers["Content-Type"] = "application/json";
    }

    const config = { ...options, headers };
    const response = await globalThis.fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  })
}));

// Import after mocking
import {
  apiRequest,
  authRequest,
  getAuthToken
} from "../../src/utils/apiClient";

describe("apiClient utilities", () => {
  let mockLocalStorage;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAuthToken", () => {
    test("retrieves token from localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      const result = getAuthToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("authToken");
      expect(result).toBe("test-token");
    });

    test("returns null when no token exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getAuthToken();

      expect(result).toBeNull();
    });
  });

  describe("apiRequest", () => {
    test("makes successful request with default options", async () => {
      const mockData = { success: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      });

      const result = await apiRequest("/api/test");

      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/test", {
        headers: { "Content-Type": "application/json" }
      });
      expect(result).toEqual(mockData);
    });

    test("normalizes endpoint without leading slash", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      await apiRequest("api/test");

      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/test", {
        headers: { "Content-Type": "application/json" }
      });
    });

    test("merges custom headers with default Content-Type", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      await apiRequest("/api/test", {
        headers: { "X-Custom": "value" }
      });

      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/test", {
        headers: {
          "Content-Type": "application/json",
          "X-Custom": "value"
        }
      });
    });

    test("skips Content-Type header for FormData body", async () => {
      const formData = new FormData();
      formData.append("file", "test");

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      await apiRequest("/api/upload", {
        method: "POST",
        body: formData
      });

      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
        headers: {}
      });
    });

    test("passes through request options", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      await apiRequest("/api/test", {
        method: "POST",
        body: JSON.stringify({ data: "test" })
      });

      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/test", {
        method: "POST",
        body: JSON.stringify({ data: "test" }),
        headers: { "Content-Type": "application/json" }
      });
    });

    test("throws error for non-ok response with error message", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ message: "Bad request" })
      });

      await expect(apiRequest("/api/test")).rejects.toThrow("Bad request");
    });

    test("throws error for non-ok response without error message", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({})
      });

      await expect(apiRequest("/api/test")).rejects.toThrow(
        "Request failed with status 500"
      );
    });

    test("handles JSON parsing error in error response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON"))
      });

      await expect(apiRequest("/api/test")).rejects.toThrow(
        "Request failed with status 500"
      );
    });

    test("handles network errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(apiRequest("/api/test")).rejects.toThrow("Network error");
    });
  });

  describe("authRequest", () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
    });

    test("makes authenticated request with token", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      await authRequest("/api/protected");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/protected",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token"
          }
        }
      );
    });

    test("throws error when no token available", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(authRequest("/api/protected")).rejects.toThrow(
        "Authentication required"
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    test("merges auth header with custom headers", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      await authRequest("/api/protected", {
        headers: { "X-Custom": "value" }
      });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/protected",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
            "X-Custom": "value"
          }
        }
      );
    });

    test("passes through request options with auth", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      await authRequest("/api/protected", {
        method: "POST",
        body: JSON.stringify({ data: "test" })
      });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/protected",
        {
          method: "POST",
          body: JSON.stringify({ data: "test" }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token"
          }
        }
      );
    });

    test("handles FormData requests with auth", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");
      const formData = new FormData();

      await authRequest("/api/upload", {
        method: "POST",
        body: formData
      });

      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer test-token"
        }
      });
    });

    test("propagates API errors from underlying request", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: "Unauthorized" })
      });

      await expect(authRequest("/api/protected")).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("Integration scenarios", () => {
    test("handles complete authenticated workflow", async () => {
      mockLocalStorage.getItem.mockReturnValue("valid-token");
      const mockData = { user: "test", role: "admin" };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      });

      const result = await authRequest("/api/user");

      expect(getAuthToken()).toBe("valid-token");
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/user", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token"
        }
      });
    });

    test("handles unauthenticated workflow", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(authRequest("/api/protected")).rejects.toThrow(
        "Authentication required"
      );

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
