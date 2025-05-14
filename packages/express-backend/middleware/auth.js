/**
 * Verify request authentication token.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Reject requests without Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  // Reject missing token
  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Attach token to request
  req.token = token;
  next();
}
