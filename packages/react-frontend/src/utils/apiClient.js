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

  const url = API_URL ? `${API_URL}${normalizedEndpoint}` : normalizedEndpoint;

  // Only set Content-Type for non-FormData requests
  const headers = {};

  // Check if body is FormData - if so, let browser set Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add any additional headers
  Object.assign(headers, options.headers);

  const config = {
    ...options,
    headers
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  return await response.json();
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
