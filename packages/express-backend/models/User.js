import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

let dirName;
try {
  dirName = __dirname || process.cwd();
} catch {
  dirName = process.cwd();
}

dotenv.config({ path: path.join(dirName, ".env") });

/**
 * User schema for authentication with username and score tracking.
 */
export const userSchema = {
  email: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }, // "user" or "admin"
  currentScore: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
};

/**
 * Validate username format and length requirements.
 */
export function validateUsername(username) {
  if (!username) {
    return { valid: false, message: "Username required" };
  }

  if (username.length < 3 || username.length > 20) {
    return { valid: false, message: "Username must be 3-20 characters" };
  }

  // Allow alphanumeric, underscore, dash
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: "Username contains invalid characters" };
  }

  return { valid: true };
}

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

    // Create unique indexes on email and username
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ username: 1 }, { unique: true });

    return { client, collection };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Create user with hashed password, username, and initial scores.
 */
export async function createUser(email, username, password, role = "user") {
  let client;
  try {
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    // Validate username format
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return { success: false, message: usernameValidation.message };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user record with initial scores
    const result = await collection.insertOne({
      email,
      username,
      password: hashedPassword,
      role,
      currentScore: 0,
      highScore: 0,
      createdAt: new Date()
    });

    return { success: true, userId: result.insertedId };
  } catch (error) {
    // Handle duplicate email or username
    if (error.code === 11000) {
      const field = error.keyPattern.email ? "Email" : "Username";
      return { success: false, message: `${field} already exists` };
    }
    console.error("User creation error:", error);
    throw error;
  } finally {
    if (client) await client.close();
  }
}

/**
 * Validate user credentials using email or username.
 */
export async function validateUser(emailOrUsername, password) {
  const { client, collection } = await getUsersCollection();

  try {
    // Determine whether input is email or username
    const isEmail = emailOrUsername.includes("@");

    // Use exact string matching with case-insensitive collation for username
    const query = isEmail
      ? { email: emailOrUsername }
      : { username: emailOrUsername };

    // Find user by email or exact username match (case-insensitive via collation)
    const user = isEmail
      ? await collection.findOne(query)
      : await collection.findOne(query, {
          collation: { locale: "en", strength: 2 }
        });

    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return { success: false, message: "Invalid credentials" };
    }

    // Return user info without password
    const { _id, email, username, role, currentScore, highScore, createdAt } =
      user;
    return {
      success: true,
      user: { _id, email, username, role, currentScore, highScore, createdAt }
    };
  } finally {
    await client.close();
  }
}

/**
 * Update user scores in database.
 */
export async function updateUserScores(userId, currentScore, highScore) {
  let client;
  try {
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    const { ObjectId } = await import("mongodb");

    // Validate ObjectId format
    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return { success: false };
    }

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          currentScore: parseInt(currentScore),
          highScore: parseInt(highScore)
        }
      }
    );

    return { success: result.matchedCount > 0 };
  } catch (error) {
    console.error("Score update error:", error);
    return { success: false };
  } finally {
    if (client) await client.close();
  }
}

/**
 * Get leaderboard data sorted by high score.
 */
export async function getLeaderboard(limit = 10) {
  let client;
  try {
    const { client: dbClient, collection } = await getUsersCollection();
    client = dbClient;

    const leaderboard = await collection
      .find({ highScore: { $gt: 0 } })
      .sort({ highScore: -1 })
      .limit(limit)
      .project({ username: 1, highScore: 1 })
      .toArray();

    return leaderboard;
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    throw error;
  } finally {
    if (client) await client.close();
  }
}
