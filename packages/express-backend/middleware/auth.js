import jwt from "jsonwebtoken";

/**
 * Verify JWT authentication token.
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

  // Verify JWT token
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Attach decoded user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
}
