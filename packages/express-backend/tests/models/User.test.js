import {
  validateUsername,
  createUser,
  validateUser,
  updateUserScores,
  getLeaderboard,
  getUsersCollection
} from "../../models/User.js";
import {
  startMemoryServer,
  stopMemoryServer,
  clearDatabase
} from "../testUtils.js";

describe("User Model", () => {
  beforeAll(async () => {
    await startMemoryServer();
  });

  afterAll(async () => {
    await stopMemoryServer();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("validateUsername", () => {
    test("accepts valid usernames", () => {
      expect(validateUsername("user123").valid).toBe(true);
      expect(validateUsername("test_user").valid).toBe(true);
      expect(validateUsername("user-name").valid).toBe(true);
      expect(validateUsername("ABC123xyz").valid).toBe(true);
    });

    test("rejects empty username", () => {
      const result = validateUsername("");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Username required");
    });

    test("rejects null username", () => {
      const result = validateUsername(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Username required");
    });

    test("rejects short usernames", () => {
      const result = validateUsername("ab");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Username must be 3-20 characters");
    });

    test("rejects long usernames", () => {
      const result = validateUsername("a".repeat(21));
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Username must be 3-20 characters");
    });

    test("rejects invalid characters", () => {
      const result = validateUsername("user@name");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Username contains invalid characters");
    });

    test("rejects special characters", () => {
      const result = validateUsername("user name");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Username contains invalid characters");
    });
  });

  describe("createUser", () => {
    test("creates user with valid data", async () => {
      const result = await createUser(
        "test@example.com",
        "testuser",
        "password123"
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    test("creates user with admin role", async () => {
      const result = await createUser(
        "admin@example.com",
        "adminuser",
        "password123",
        "admin"
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    test("rejects duplicate email", async () => {
      await createUser("test@example.com", "testuser1", "password123");

      const result = await createUser(
        "test@example.com",
        "testuser2",
        "password123"
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email already exists");
    });

    test("rejects duplicate username", async () => {
      await createUser("test1@example.com", "testuser", "password123");

      const result = await createUser(
        "test2@example.com",
        "testuser",
        "password123"
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Username already exists");
    });

    test("rejects invalid username format", async () => {
      const result = await createUser("test@example.com", "a", "password123");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Username must be 3-20 characters");
    });

    test("hashes password correctly", async () => {
      const email = "test@example.com";
      const username = "testuser";
      const password = "password123";

      await createUser(email, username, password);

      // Verify password was hashed
      const { client, collection } = await getUsersCollection();
      const user = await collection.findOne({ email });
      await client.close();

      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });

    test("sets default scores to zero", async () => {
      const email = "test@example.com";
      const username = "testuser";

      await createUser(email, username, "password123");

      const { client, collection } = await getUsersCollection();
      const user = await collection.findOne({ email });
      await client.close();

      expect(user.currentScore).toBe(0);
      expect(user.highScore).toBe(0);
    });
  });

  describe("validateUser", () => {
    beforeEach(async () => {
      await createUser("test@example.com", "testuser", "password123");
    });

    test("validates user with email", async () => {
      const result = await validateUser("test@example.com", "password123");

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.username).toBe("testuser");
      expect(result.user.password).toBeUndefined();
    });

    test("validates user with username", async () => {
      const result = await validateUser("testuser", "password123");

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.username).toBe("testuser");
    });

    test("validates username case insensitive", async () => {
      const result = await validateUser("TESTUSER", "password123");

      expect(result.success).toBe(true);
      expect(result.user.username).toBe("testuser");
    });

    test("rejects invalid email", async () => {
      const result = await validateUser("wrong@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid credentials");
    });

    test("rejects invalid username", async () => {
      const result = await validateUser("wronguser", "password123");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid credentials");
    });

    test("rejects invalid password", async () => {
      const result = await validateUser("test@example.com", "wrongpassword");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid credentials");
    });

    test("returns user fields correctly", async () => {
      const result = await validateUser("test@example.com", "password123");

      expect(result.user).toHaveProperty("_id");
      expect(result.user).toHaveProperty("email");
      expect(result.user).toHaveProperty("username");
      expect(result.user).toHaveProperty("role");
      expect(result.user).toHaveProperty("currentScore");
      expect(result.user).toHaveProperty("highScore");
      expect(result.user).toHaveProperty("createdAt");
      expect(result.user).not.toHaveProperty("password");
    });
  });

  describe("updateUserScores", () => {
    let userId;

    beforeEach(async () => {
      const result = await createUser(
        "test@example.com",
        "testuser",
        "password123"
      );
      userId = result.userId.toString();
    });

    test("updates scores successfully", async () => {
      const result = await updateUserScores(userId, 5, 10);

      expect(result.success).toBe(true);
    });

    test("persists score updates to database", async () => {
      await updateUserScores(userId, 7, 15);

      // Verify scores persisted
      const { client, collection } = await getUsersCollection();
      const { ObjectId } = await import("mongodb");
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      await client.close();

      expect(user.currentScore).toBe(7);
      expect(user.highScore).toBe(15);
    });

    test("handles multiple score updates", async () => {
      await updateUserScores(userId, 3, 8);
      await updateUserScores(userId, 12, 12);

      // Verify final scores
      const { client, collection } = await getUsersCollection();
      const { ObjectId } = await import("mongodb");
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      await client.close();

      expect(user.currentScore).toBe(12);
      expect(user.highScore).toBe(12);
    });

    test("handles score decrease", async () => {
      await updateUserScores(userId, 10, 15);
      await updateUserScores(userId, 3, 15);

      const { client, collection } = await getUsersCollection();
      const { ObjectId } = await import("mongodb");
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      await client.close();

      expect(user.currentScore).toBe(3);
      expect(user.highScore).toBe(15);
    });

    test("rejects invalid user ID", async () => {
      const result = await updateUserScores("invalid-id", 5, 10);

      expect(result.success).toBe(false);
    });
  });

  describe("getLeaderboard", () => {
    beforeEach(async () => {
      await createUser("user1@example.com", "user1", "password123");
      await createUser("user2@example.com", "user2", "password123");
      await createUser("user3@example.com", "user3", "password123");
      await createUser("user4@example.com", "user4", "password123");

      // Set scores
      const { client, collection } = await getUsersCollection();

      await collection.updateOne(
        { email: "user1@example.com" },
        { $set: { highScore: 25 } }
      );
      await collection.updateOne(
        { email: "user2@example.com" },
        { $set: { highScore: 15 } }
      );
      await collection.updateOne(
        { email: "user3@example.com" },
        { $set: { highScore: 35 } }
      );
      await collection.updateOne(
        { email: "user4@example.com" },
        { $set: { highScore: 0 } }
      );

      await client.close();
    });

    test("returns leaderboard in descending order", async () => {
      const leaderboard = await getLeaderboard(10);

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].username).toBe("user3");
      expect(leaderboard[0].highScore).toBe(35);
      expect(leaderboard[1].username).toBe("user1");
      expect(leaderboard[1].highScore).toBe(25);
      expect(leaderboard[2].username).toBe("user2");
      expect(leaderboard[2].highScore).toBe(15);
    });

    test("respects limit parameter", async () => {
      const leaderboard = await getLeaderboard(2);

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].highScore).toBe(35);
      expect(leaderboard[1].highScore).toBe(25);
    });

    test("excludes zero scores", async () => {
      const leaderboard = await getLeaderboard(10);

      const zeroScoreUser = leaderboard.find(
        (user) => user.username === "user4"
      );
      expect(zeroScoreUser).toBeUndefined();
    });

    test("returns only username and highScore fields", async () => {
      const leaderboard = await getLeaderboard(10);

      leaderboard.forEach((entry) => {
        expect(entry).toHaveProperty("username");
        expect(entry).toHaveProperty("highScore");
        expect(entry).toHaveProperty("_id");
        expect(entry).not.toHaveProperty("email");
        expect(entry).not.toHaveProperty("password");
        expect(entry).not.toHaveProperty("currentScore");
      });
    });

    test("handles empty leaderboard", async () => {
      // Clear all scores
      const { client, collection } = await getUsersCollection();
      await collection.updateMany({}, { $set: { highScore: 0 } });
      await client.close();

      const leaderboard = await getLeaderboard(10);

      expect(leaderboard).toHaveLength(0);
    });
  });
});
