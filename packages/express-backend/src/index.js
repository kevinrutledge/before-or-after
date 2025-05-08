import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./db.js";
import apiRoutes from "./routes/routes.js";

/**
 * Initialize Express server with API routes.
 */
dotenv.config();
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

// Start server function
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

// Execute server startup
startServer();
