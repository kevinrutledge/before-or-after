import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
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
 * User schema for authentication.
 */
export const userSchema = {
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }, // "user" or "admin"
  createdAt: { type: Date, default: Date.now }
};

/**
 * Get database connection and users collection.
 */
export async function getUsersCollection() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable not set");
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db();
    const collection = db.collection("users");

    // Create unique index on email if it doesn't exist
    await collection.createIndex({ email: 1 }, { unique: true });

    return { client, collection };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Create a new user with hashed password.
 */
export async function createUser(email, password, role = "user") {
  let client;
  try {
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    const result = await collection.insertOne({
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });

    return { success: true, userId: result.insertedId };
  } catch (error) {
    // Handle duplicate email
    if (error.code === 11000) {
      return { success: false, message: "Email already exists" };
    }
    console.error("User creation error:", error);
    throw error;
  } finally {
    if (client) await client.close();
  }
}

/**
 * Validate user credentials.
 */
export async function validateUser(email, password) {
  const { client, collection } = await getUsersCollection();

  try {
    // Find the user
    const user = await collection.findOne({ email });

    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return { success: false, message: "Invalid credentials" };
    }

    // Return user info without password
    const { _id, email: userEmail, role, createdAt } = user;
    return {
      success: true,
      user: { _id, email: userEmail, role, createdAt }
    };
  } finally {
    await client.close();
  }
}
