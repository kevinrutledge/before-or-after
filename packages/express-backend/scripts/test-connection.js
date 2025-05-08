import { testConnection } from "../src/db.js";

/**
 * Run database connection test and exit with status code.
 */
async function runConnectionTest() {
  try {
    const success = await testConnection();

    if (success) {
      console.log("✅ Successfully connected to MongoDB cluster");
      process.exit(0);
    } else {
      console.error("❌ Failed to connect to MongoDB cluster");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Connection test error:", error);
    process.exit(1);
  }
}

// Execute test
runConnectionTest();
