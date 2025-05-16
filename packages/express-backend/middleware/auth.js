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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ message: "Token expired" });
    }

    // Attach decoded user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Restrict route to admin users.
 */
export function adminOnly(req, res, next) {
  // verifyToken must be called before this middleware
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

// Export middleware functions
export default {
  verifyToken,
  adminOnly
};
