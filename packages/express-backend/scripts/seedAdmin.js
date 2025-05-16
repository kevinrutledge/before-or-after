import { createUser } from "../models/User.js";
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
 * Create admin user for system access.
 */
async function seedAdmin() {
  try {
    // Default admin credentials (override with environment variables)
    const email = process.env.ADMIN_EMAIL || "admin@beforeorafter.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    // Create admin user with admin role
    const result = await createUser(email, password, "admin");

    if (result.success) {
      console.log(`✅ Admin user created: ${email}`);
    } else {
      console.log(`ℹ️ ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

// ES Module alternative to require.main === module
// Check if this file is being run directly
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  seedAdmin().catch((err) => {
    console.error("Seed admin script failed:", err);
    process.exit(1);
  });
}

export { seedAdmin };
