import { jest } from "@jest/globals";

/**
 * Mock API client for Jest environment.
 * Provides consistent interface without import.meta dependencies.
 */

/**
 * Mock apiRequest function for general API calls.
 */
export const apiRequest = jest.fn().mockResolvedValue({});

/**
 * Mock authRequest function for authenticated API calls.
 */
export const authRequest = jest.fn().mockResolvedValue({});

/**
 * Mock getAuthToken function for token retrieval.
 */
export const getAuthToken = jest.fn().mockReturnValue("mock-token");
