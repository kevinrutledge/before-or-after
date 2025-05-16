import express from "express";
import cors from "cors";
import { connectToDatabase } from "./db.js";
import apiRoutes from "./routes/routes.js";
import authRoutes from "./routes/authRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

let dirName;
try {
  dirName = path.dirname(fileURLToPath(import.meta.url));
} catch {
  dirName = process.cwd();
}
dotenv.config({ path: path.join(dirName, "../.env") });

/**
 * Initialize Express server with API routes.
 */
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());

// Root endpoint for health check
app.get("/", (req, res) => {
  res.send("Before or After API is running");
});

// Mount API routes
app.use("/api", apiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordResetRoutes);

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const startServer = async () => {
    try {
      // Connect to database
      await connectToDatabase();

      // Start Express server
      const PORT = process.env.PORT || 8000;
      app.listen(PORT, () => {
        console.log();
        console.log(`🚀 Server listening at http://localhost:${PORT}/`);
        console.log();
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  };

  // Execute server startup for local development
  startServer();
} else {
  // Connect to database when imported (serverless environment)
  connectToDatabase().catch((err) => {
    console.error("Database connection failed:", err);
  });
}

// Export the Express app for Vercel
export default app;
