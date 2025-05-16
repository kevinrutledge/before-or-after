import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

let dirName;
try {
  dirName = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {
  dirName = process.cwd();
}

dotenv.config({ path: path.join(dirName, "../.env") });

/**
 * Connect to MongoDB cluster with mongoose.
 */
export async function connectToDatabase() {
  // Validate connection string exists
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  try {
    // Connect with default options
    await mongoose.connect(process.env.MONGO_URI);
    console.info("MongoDB connection established");
    return mongoose.connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Test database connection and verify availability.
 */
export async function testConnection() {
  try {
    await connectToDatabase();
    const result = await mongoose.connection.db.admin().ping();
    console.info("MongoDB connection successful:", result);
    return true;
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    return false;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.info("MongoDB connection closed");
    }
  }
}
