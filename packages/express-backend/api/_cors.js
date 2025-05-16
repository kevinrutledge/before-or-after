/**
 * Enable CORS for serverless functions with consistent headers.
 * Import in API endpoints to standardize cross-origin request handling.
 */
export function corsHandler(req, res) {
  // Allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Enable common HTTP methods
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // Support standard authentication and content headers
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Enable credentials for cookies and auth
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.status(204).end(); // Return empty response
    return true; // Signal request completion
  }

  return false; // Continue with request processing
}
