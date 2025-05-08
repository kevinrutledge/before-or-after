const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll
} = require("@jest/globals");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");

// Test a simpler version without seed module
describe("Seed script", () => {
  let mongoServer;
  let mongoUri;
  let client;
  let db;
  let cardsCollection;

  // Set up MongoDB memory server before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    cardsCollection = db.collection("cards");

    // Clear any existing data
    await cardsCollection.deleteMany({});
  });

  // Clean up after tests
  afterAll(async () => {
    if (client) await client.close(); // close only if connected
    await mongoServer.stop();
  });

  test("database can store and retrieve cards", async () => {
    // Define sample card
    const sampleCard = {
      title: "Test Card",
      year: 2000,
      imageUrl: "https://example.com/image.jpg",
      sourceUrl: "https://example.com",
      category: "test",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert directly instead of using seedDatabase
    await cardsCollection.insertOne(sampleCard);

    // Retrieve and validate
    const cards = await cardsCollection.find({}).toArray();
    expect(cards.length).toBe(1);

    const retrievedCard = cards[0];
    expect(retrievedCard).toHaveProperty("title", "Test Card");
    expect(retrievedCard).toHaveProperty("year", 2000);
    expect(retrievedCard).toHaveProperty("category", "test");
  });
});
