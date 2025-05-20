/**
 * Manage authentication token operations.
 */

// Auth-related storage keys
const AUTH_TOKEN_KEY = "authToken";
const GUEST_MODE_KEY = "guestMode";

// Store token in localStorage
export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Retrieve token from localStorage
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Remove token from localStorage
export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Set guest mode in localStorage
export function setGuestMode(enabled = true) {
  localStorage.setItem(GUEST_MODE_KEY, enabled.toString());
}

// Check if guest mode is enabled
export function isGuestMode() {
  return localStorage.getItem(GUEST_MODE_KEY) === "true";
}

// Clear guest mode from localStorage
export function clearGuestMode() {
  localStorage.removeItem(GUEST_MODE_KEY);
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = getAuthToken();
  if (!token) return false;

  // Check if token is expired
  try {
    const payload = parseToken(token);
    if (!payload || !payload.exp) return false;

    // Check if token is expired (exp is in seconds)
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

// Parse JWT token to get user info
export function parseToken(token) {
  if (!token) return null;

  try {
    // Get the payload part of the JWT (second part)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
}

// Get current user info from token
export function getCurrentUser() {
  const token = getAuthToken();
  return token ? parseToken(token) : null;
}
