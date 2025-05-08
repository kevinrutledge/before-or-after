import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connect to MongoDB cluster with mongoose.
 */
export async function connectToDatabase() {
  // Validate connection string exists
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  try {
    // Establish connection to cluster
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

    // Verify connection with simple command
    const result = await mongoose.connection.db.admin().ping();
    console.info("MongoDB connection successful:", result);

    return true;
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    return false;
  } finally {
    // Close connection after test
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.info("MongoDB connection closed");
    }
  }
}
