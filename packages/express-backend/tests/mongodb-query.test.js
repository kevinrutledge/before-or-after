const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll
} = require("@jest/globals");
const { getCardsCollection } = require("./mocks/Card.js");
const { seedDatabase } = require("./mocks/seed.js");

describe("MongoDB Query Performance", () => {
  let client;
  let collection;

  beforeAll(async () => {
    // Seed the database with test data
    await seedDatabase();

    // Get collection
    const result = await getCardsCollection();
    client = result.client;
    collection = result.collection;
  });

  afterAll(async () => {
    if (client) await client.close();
  });

  test("year-based queries use index", async () => {
    // Skip test if no documents exist
    const count = await collection.countDocuments();
    if (count === 0) {
      console.warn("Skipping test: No documents in collection");
      return;
    }

    // Execute query with explain
    const explanation = await collection
      .find({ year: { $gt: 1950 } })
      .explain("executionStats");

    // Verify execution plan
    const executionStages = explanation.executionStats.executionStages;

    // Check if IXSCAN exists in the execution stages
    function hasIndexScan(stages) {
      if (stages.stage === "IXSCAN") return true;
      if (stages.inputStage && stages.inputStage.stage === "IXSCAN")
        return true;
      return false;
    }

    expect(hasIndexScan(executionStages)).toBe(true);

    // Verify reasonable execution time
    expect(explanation.executionStats.executionTimeMillis).toBeLessThan(100);
  });

  test("month-based queries use index", async () => {
    // Skip test if no documents exist
    const count = await collection.countDocuments();
    if (count === 0) {
      console.warn("Skipping test: No documents in collection");
      return;
    }

    // Execute query with explain
    const explanation = await collection
      .find({ month:5, category: "movie" })
      .explain("executionStats");

    // Verify execution plan
    const executionStages = explanation.executionStats.executionStages;

    // Check if IXSCAN exists in the execution stages
    function hasIndexScan(stages) {
      if (stages.stage === "IXSCAN") return true;
      if (stages.inputStage && stages.inputStage.stage === "IXSCAN")
        return true;
      return false;
    }

    expect(hasIndexScan(executionStages)).toBe(true);

    // Verify reasonable execution time
    expect(explanation.executionStats.executionTimeMillis).toBeLessThan(100);
  });
});
