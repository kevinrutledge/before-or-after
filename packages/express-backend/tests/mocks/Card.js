// Mock implementation of Card.js for testing
const cardSchema = {
  title: { type: String, required: true },
  year: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Mock of getCardsCollection function
async function getCardsCollection() {
  const mockClient = { close: jest.fn() };
  const mockCollection = {
    createIndexes: jest.fn().mockResolvedValue(true),
    countDocuments: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      toArray: jest
        .fn()
        .mockResolvedValue([{ title: "Test Card", year: 2000 }]),
      explain: jest.fn().mockResolvedValue({
        executionStats: {
          executionTimeMillis: 5,
          executionStages: { stage: "IXSCAN" }
        }
      })
    }),
    indexes: jest
      .fn()
      .mockResolvedValue([
        { name: "year_index" },
        { name: "category_index" },
        { name: "year_category_index" }
      ])
  };

  return { client: mockClient, collection: mockCollection };
}

module.exports = {
  cardSchema,
  getCardsCollection
};
