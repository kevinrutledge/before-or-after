import { MongoClient } from "mongodb";
import { getCardsCollection } from "../models/Card.js";

describe("MongoDB Indexes", () => {
  let client;
  let collection;

  beforeAll(async () => {
    // Connect to test database
    const { client: dbClient, collection: cardsCollection } =
      await getCardsCollection();
    client = dbClient;
    collection = cardsCollection;
  });

  afterAll(async () => {
    // Close connection
    if (client) await client.close();
  });

  test("required indexes exist on cards collection", async () => {
    // Get all indexes
    const indexes = await collection.indexes();

    // Extract index names
    const indexNames = indexes.map((index) => index.name);

    // Verify required indexes exist
    expect(indexNames).toContain("year_index");
    expect(indexNames).toContain("category_index");
    expect(indexNames).toContain("year_category_index");
  });
});
