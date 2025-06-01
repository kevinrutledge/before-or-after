import { getLossGifsCollection } from "../models/LossGif.js";
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
 * Initialize 5 fixed loss GIF categories with score thresholds.
 * Create records only when database empty to prevent duplicates.
 */
async function createLossGifs() {
  let client;

  try {
    const { client: dbClient, collection } = await getLossGifsCollection();
    client = dbClient;

    // Check if records already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(
        `Found ${existingCount} existing loss GIF records. Skipping creation.`
      );
      return;
    }

    // Define 5 fixed loss GIF categories with score thresholds
    const lossGifCategories = [
      {
        category: "Terrible",
        scoreRange: "< 2",
        streakThreshold: 2,
        imageUrl: "https://placeholder-gif-url.com/terrible.gif",
        thumbnailUrl: "https://placeholder-gif-url.com/terrible-thumb.gif",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: "Frustrated",
        scoreRange: "2 - 4",
        streakThreshold: 5,
        imageUrl: "https://placeholder-gif-url.com/frustrated.gif",
        thumbnailUrl: "https://placeholder-gif-url.com/frustrated-thumb.gif",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: "Decent",
        scoreRange: "5 - 7",
        streakThreshold: 8,
        imageUrl: "https://placeholder-gif-url.com/decent.gif",
        thumbnailUrl: "https://placeholder-gif-url.com/decent-thumb.gif",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: "Satisfied",
        scoreRange: "8 - 11",
        streakThreshold: 12,
        imageUrl: "https://placeholder-gif-url.com/satisfied.gif",
        thumbnailUrl: "https://placeholder-gif-url.com/satisfied-thumb.gif",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: "Ecstatic",
        scoreRange: "≥ 12",
        streakThreshold: 999999, // High threshold for unlimited range
        imageUrl: "https://placeholder-gif-url.com/ecstatic.gif",
        thumbnailUrl: "https://placeholder-gif-url.com/ecstatic-thumb.gif",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert all categories in single operation
    const result = await collection.insertMany(lossGifCategories);
    console.log(
      `Created ${result.insertedCount} loss GIF categories successfully`
    );

    // Display created categories
    lossGifCategories.forEach((category, index) => {
      console.log(
        `  ${index + 1}. ${category.category} (threshold: ${category.streakThreshold})`
      );
    });
  } catch (error) {
    console.error("Loss GIF creation error:", error);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

// Execute script when run directly
createLossGifs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
  });
