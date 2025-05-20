/**
 * API client utility for making consistent backend requests.
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Make a request to the API.
 */
export async function apiRequest(endpoint, options = {}) {
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  // Check if we're in production (using the Vite detection method)
  const isProduction = import.meta.env.PROD;

  const url =
    isProduction && API_URL
      ? `${API_URL}${normalizedEndpoint}`
      : normalizedEndpoint;

  console.log(`Making API request to: ${url}`);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      // Try to parse error message from response
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Unable to parse JSON, use default error message
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get auth token from localStorage.
 */
export function getAuthToken() {
  return localStorage.getItem("authToken");
}

/**
 * Make an authenticated request to the API.
 */
export async function authRequest(endpoint, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    ...options.headers
  };

  return apiRequest(endpoint, {
    ...options,
    headers: authHeaders
  });
}
