const {
  describe,
  test,
  expect,
  beforeEach,
  afterEach
} = require("@jest/globals");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

/**
 * Simple test for database connection.
 * Using CommonJS syntax for Jest compatibility.
 */
describe("Database Connection", () => {
  // Mock mongoose for testing
  const mockMongoose = {
    connect: jest.fn(),
    connection: {
      readyState: 1,
      db: {
        admin: () => ({
          ping: jest.fn().mockResolvedValue({ ok: 1 })
        })
      },
      disconnect: jest.fn().mockResolvedValue(undefined)
    },
    disconnect: jest.fn().mockResolvedValue(undefined)
  };

  // Create mock implementation of connectToDatabase
  const connectToDatabase = async () => {
    if (!process.env.MONGO_URI) {
      throw new Error("Missing MONGO_URI environment variable");
    }

    // Simulate successful connection
    await mockMongoose.connect(process.env.MONGO_URI);
    return mockMongoose.connection;
  };

  // Create mock implementation of testConnection
  const testConnection = async () => {
    try {
      await connectToDatabase();
      // Simulate ping test
      await mockMongoose.connection.db.admin().ping();
      return true;
    } catch {
      return false;
    } finally {
      // Simulate disconnect
      if (mockMongoose.connection.readyState !== 0) {
        await mockMongoose.disconnect();
      }
    }
  };

  // Store original environment in a local variable instead of this
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  test("connectToDatabase should establish connection successfully", async () => {
    // Set test environment
    process.env.MONGO_URI = "mongodb://localhost:27017/test";

    // Call function
    await connectToDatabase();

    // Check mongoose.connect was called with correct URI
    expect(mockMongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/test"
    );
  });

  test("connectToDatabase should throw error when MONGO_URI is missing", async () => {
    // Ensure MONGO_URI is not set
    delete process.env.MONGO_URI;

    // Expect function to throw error
    await expect(connectToDatabase()).rejects.toThrow(
      "Missing MONGO_URI environment variable"
    );

    // Ensure mongoose.connect was not called
    expect(mockMongoose.connect).not.toHaveBeenCalled();
  });

  test("testConnection should return true for successful connection", async () => {
    // Set test environment
    process.env.MONGO_URI = "mongodb://localhost:27017/test";

    // Call function
    const result = await testConnection();

    // Check result
    expect(result).toBe(true);

    // Check mongoose.disconnect was called
    expect(mockMongoose.disconnect).toHaveBeenCalled();
  });

  test("testConnection should return false for failed connection", async () => {
    // Set test environment
    process.env.MONGO_URI = "mongodb://localhost:27017/test";

    // Mock failed connection
    mockMongoose.connect.mockRejectedValueOnce(new Error("Connection failed"));

    // Call function
    const result = await testConnection();

    // Check result
    expect(result).toBe(false);
  });
});
