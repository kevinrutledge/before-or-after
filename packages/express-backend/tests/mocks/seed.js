// Mock implementation of seed.js for testing
async function seedDatabase() {
  // Just return a mock success result
  return {
    deleteResult: { deletedCount: 10 },
    insertResult: { insertedCount: 10 }
  };
}

module.exports = { seedDatabase };
