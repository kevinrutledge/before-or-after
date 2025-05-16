import { getCardsCollection } from "../models/Card.js";
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
 * Seed database with sample cards for gameplay testing.
 */
export async function seedDatabase() {
  let client;
  let memoryServer;

  try {
    // Get database connection and collection
    const {
      client: dbClient,
      collection,
      memoryServer: dbMemoryServer
    } = await getCardsCollection();
    client = dbClient;
    memoryServer = dbMemoryServer;

    // Clear existing cards
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing cards`);

    // Prepare sample card data
    const sampleCards = [
      {
        title: "Star Wars: A New Hope",
        year: 1977,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/8/82/Leiadeathstar.jpg",
        sourceUrl: "https://www.imdb.com/title/tt0076759/",
        category: "movie",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "The Beatles - Abbey Road",
        year: 1969,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Abbey_Road",
        category: "album",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Super Mario Bros",
        year: 1985,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/0/03/Super_Mario_Bros._box.png",
        sourceUrl: "https://en.wikipedia.org/wiki/Super_Mario_Bros",
        category: "game",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "iPhone First Generation",
        year: 2007,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/IPhone_1st_Gen.svg/800px-IPhone_1st_Gen.svg.png",
        sourceUrl: "https://en.wikipedia.org/wiki/IPhone_(1st_generation)",
        category: "technology",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Mona Lisa",
        year: 1503,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Mona_Lisa",
        category: "art",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "The Shining",
        year: 1980,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/b/bb/The_shining_heres_johnny.jpg",
        sourceUrl: "https://www.imdb.com/title/tt0081505/",
        category: "movie",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Michael Jackson - Thriller",
        year: 1982,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
        sourceUrl: "https://en.wikipedia.org/wiki/Thriller_(album)",
        category: "album",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "World Wide Web",
        year: 1989,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/First_Web_Server.jpg/1920px-First_Web_Server.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/World_Wide_Web",
        category: "technology",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "The Starry Night",
        year: 1889,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1920px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/The_Starry_Night",
        category: "art",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Minecraft",
        year: 2011,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/1/17/Minecraft_explore_landscape.png",
        sourceUrl: "https://en.wikipedia.org/wiki/Minecraft",
        category: "game",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert sample cards
    const insertResult = await collection.insertMany(sampleCards);
    console.log(
      `Successfully inserted ${insertResult.insertedCount} sample cards`
    );

    return { deleteResult, insertResult };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    if (client) await client.close();
    if (memoryServer) await memoryServer.stop();
  }
}

// Run when called directly
if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });
}

// Export for tests
module.exports = { seedDatabase };
