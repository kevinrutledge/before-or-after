import { jest } from "@jest/globals";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
  parseToken,
  getCurrentUser
} from "../../src/utils/authUtils";

describe("authUtils utilities", () => {
  let mockLocalStorage;
  let mockConsoleError;
  let originalDateNow;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true
    });

    // Mock console.error
    mockConsoleError = jest.spyOn(console, "error").mockImplementation();

    // Mock Date.now
    originalDateNow = Date.now;
    Date.now = jest.fn(() => 1000000000000); // Fixed timestamp
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    Date.now = originalDateNow;
  });

  describe("setAuthToken", () => {
    test("stores token in localStorage", () => {
      setAuthToken("test-token");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "authToken",
        "test-token"
      );
    });

    test("handles empty token", () => {
      setAuthToken("");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("authToken", "");
    });

    test("handles null token", () => {
      setAuthToken(null);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("authToken", null);
    });
  });

  describe("getAuthToken", () => {
    test("retrieves token from localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("stored-token");

      const result = getAuthToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("authToken");
      expect(result).toBe("stored-token");
    });

    test("returns null when no token exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getAuthToken();

      expect(result).toBeNull();
    });

    test("returns empty string when token is empty", () => {
      mockLocalStorage.getItem.mockReturnValue("");

      const result = getAuthToken();

      expect(result).toBe("");
    });
  });

  describe("removeAuthToken", () => {
    test("removes token from localStorage", () => {
      removeAuthToken();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("authToken");
    });
  });

  describe("parseToken", () => {
    test("parses valid JWT token", () => {
      // Valid JWT with payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":2000000000}
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.Twz7-WSpNUaS9pp-XW_bb5Z_6rNyEfhPcg6f3z8F6_8";

      const result = parseToken(validToken);

      expect(result).toEqual({
        sub: "1234567890",
        name: "John Doe",
        iat: 1516239022,
        exp: 2000000000
      });
    });

    test("returns null for null token", () => {
      const result = parseToken(null);

      expect(result).toBeNull();
    });

    test("returns null for empty token", () => {
      const result = parseToken("");

      expect(result).toBeNull();
    });

    test("returns null for malformed token", () => {
      const result = parseToken("invalid-token");

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error parsing token:",
        expect.any(Error)
      );
    });

    test("returns null for token with invalid base64", () => {
      const invalidToken = "header.invalid-base64.signature";

      const result = parseToken(invalidToken);

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error parsing token:",
        expect.any(Error)
      );
    });

    test("returns null for token with invalid JSON", () => {
      // Token with invalid JSON in payload
      const invalidJsonToken = "header.aW52YWxpZC1qc29u.signature";

      const result = parseToken(invalidJsonToken);

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error parsing token:",
        expect.any(Error)
      );
    });

    test("handles URL-safe base64 encoding", () => {
      // Token with URL-safe base64 characters (- and _)
      const urlSafeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.Twz7-WSpNUaS9pp-XW_bb5Z_6rNyEfhPcg6f3z8F6_8";

      const result = parseToken(urlSafeToken);

      expect(result).toEqual(
        expect.objectContaining({
          sub: "1234567890",
          name: "John Doe"
        })
      );
    });
  });

  describe("isAuthenticated", () => {
    test("returns true for valid non-expired token", () => {
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.Twz7-WSpNUaS9pp-XW_bb5Z_6rNyEfhPcg6f3z8F6_8";

      mockLocalStorage.getItem.mockReturnValue(validToken);

      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    test("returns false when no token exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    test("returns false for expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour past
      // Create token with past expiration
      const expiredPayload = { exp: pastExp };
      const base64Payload = btoa(JSON.stringify(expiredPayload));
      const expiredToken = `header.${base64Payload}.signature`;

      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    test("returns false for token without exp field", () => {
      const noExpPayload = { sub: "1234567890", name: "John Doe" };
      const base64Payload = btoa(JSON.stringify(noExpPayload));
      const noExpToken = `header.${base64Payload}.signature`;

      mockLocalStorage.getItem.mockReturnValue(noExpToken);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    test("returns false for malformed token", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-token");

      const result = isAuthenticated();

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error parsing token:",
        expect.any(Error)
      );
    });

    test("returns false for empty token", () => {
      mockLocalStorage.getItem.mockReturnValue("");

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    test("handles token parsing errors gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("malformed.token");

      const result = isAuthenticated();

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error parsing token:",
        expect.any(Error)
      );
    });
  });

  describe("getCurrentUser", () => {
    test("returns user info from valid token", () => {
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.Twz7-WSpNUaS9pp-XW_bb5Z_6rNyEfhPcg6f3z8F6_8";

      mockLocalStorage.getItem.mockReturnValue(validToken);

      const result = getCurrentUser();

      expect(result).toEqual({
        sub: "1234567890",
        name: "John Doe",
        iat: 1516239022,
        exp: 2000000000
      });
    });

    test("returns null when no token exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getCurrentUser();

      expect(result).toBeNull();
    });

    test("returns null for malformed token", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-token");

      const result = getCurrentUser();

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error parsing token:",
        expect.any(Error)
      );
    });

    test("returns null for empty token", () => {
      mockLocalStorage.getItem.mockReturnValue("");

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("Integration scenarios", () => {
    test("handles complete authentication flow", () => {
      const token = "test-token";

      // Set token
      setAuthToken(token);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("authToken", token);

      // Get token
      mockLocalStorage.getItem.mockReturnValue(token);
      const retrievedToken = getAuthToken();
      expect(retrievedToken).toBe(token);

      // Remove token
      removeAuthToken();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("authToken");
    });

    test("handles authentication validation workflow", () => {
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.Twz7-WSpNUaS9pp-XW_bb5Z_6rNyEfhPcg6f3z8F6_8";

      mockLocalStorage.getItem.mockReturnValue(validToken);

      // Check authentication
      const isAuth = isAuthenticated();
      expect(isAuth).toBe(true);

      // Get user info
      const user = getCurrentUser();
      expect(user).toEqual(
        expect.objectContaining({
          sub: "1234567890",
          name: "John Doe"
        })
      );
    });

    test("handles invalid token workflow", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-token");

      // Check authentication fails
      const isAuth = isAuthenticated();
      expect(isAuth).toBe(false);

      // Get user returns null
      const user = getCurrentUser();
      expect(user).toBeNull();

      // Both functions log errors
      expect(mockConsoleError).toHaveBeenCalledTimes(2);
    });

    test("handles localStorage errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      expect(() => getAuthToken()).toThrow("localStorage error");
    });
  });
});
