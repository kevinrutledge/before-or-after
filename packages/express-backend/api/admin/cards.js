import { corsHandler } from "../_cors.js";
import { getCardsCollection } from "../../models/Card.js";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import {
  processImage,
  validateImageFile
} from "../../services/imageProcessor.js";
import { uploadImagePair, deleteS3Image } from "../../services/s3Service.js";
import { ObjectId } from "mongodb";
import { parseMultipartData } from "../../utils/multipartParser.js";

export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  // Use existing auth middleware
  try {
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()));
    });

    await new Promise((resolve, reject) => {
      adminOnly(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch {
    return; // Middleware already sent error response
  }

  let client;
  try {
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    if (req.method === "GET") {
      const { limit = 20, cursor, search } = req.query;

      // Build MongoDB query with optional search
      const query = {};

      if (cursor) {
        query._id = { $gt: new ObjectId(cursor) };
      }

      // Add search filter when search parameter provided
      if (search && search.trim()) {
        const searchTerm = search.trim();
        query.$or = [
          { title: { $regex: searchTerm, $options: "i" } },
          { category: { $regex: searchTerm, $options: "i" } },
          { year: parseInt(searchTerm) || 0 }
        ];
      }

      const cards = await collection
        .find(query)
        .limit(parseInt(limit))
        .toArray();

      res.status(200).json(cards);
    } else if (req.method === "POST") {
      const {
        title,
        year,
        month,
        imageUrl,
        thumbnailUrl,
        sourceUrl,
        category
      } = req.body;

      if (!title || !year || !month || !imageUrl || !sourceUrl || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newCard = {
        title,
        year: parseInt(year),
        month: parseInt(month),
        imageUrl,
        thumbnailUrl: thumbnailUrl || null,
        sourceUrl,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newCard);
      res.status(201).json({ ...newCard, _id: result.insertedId });
    } else if (req.method === "PUT") {
      // Handle multipart data for optional image updates
      const chunks = [];

      req.on("data", (chunk) => {
        chunks.push(chunk);
      });

      req.on("end", async () => {
        let updatedUrls = null;
        let originalCard = null;

        try {
          const cardId = req.url.split("/").pop();
          if (!cardId || !ObjectId.isValid(cardId)) {
            return res.status(400).json({ message: "Invalid card ID" });
          }

          // Get original card for cleanup
          originalCard = await collection.findOne({
            _id: new ObjectId(cardId)
          });
          if (!originalCard) {
            return res.status(404).json({ message: "Card not found" });
          }

          const bodyBuffer = Buffer.concat(chunks);
          const contentType = req.headers["content-type"] || "";
          let fields = {};
          let files = {};

          // Parse form data
          if (contentType.includes("multipart/form-data")) {
            const parsed = parseMultipartData(bodyBuffer, contentType);
            if (parsed) {
              fields = parsed.fields;
              files = parsed.files;
            }
          } else if (contentType === "application/json") {
            fields = JSON.parse(bodyBuffer.toString());
          }

          // Validate required text fields
          const { title, year, month, category, sourceUrl, cropMode } = fields;
          if (!title || !year || !month || !category || !sourceUrl) {
            return res.status(400).json({ message: "Missing required fields" });
          }

          // Process new image if provided
          if (files.image) {
            validateImageFile(files.image);
            const { thumbnail, large } = await processImage(
              files.image.buffer,
              cropMode
            );
            updatedUrls = await uploadImagePair(thumbnail, large);
          }

          // Build update object
          const updateData = {
            title,
            year: parseInt(year),
            month: parseInt(month),
            category,
            sourceUrl,
            updatedAt: new Date()
          };

          // Add image URLs if new image uploaded
          if (updatedUrls) {
            updateData.imageUrl = updatedUrls.imageUrl;
            updateData.thumbnailUrl = updatedUrls.thumbnailUrl;
          }

          // Update card in database
          const result = await collection.updateOne(
            { _id: new ObjectId(cardId) },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            // Cleanup new images if card update failed
            if (updatedUrls) {
              await deleteS3Image(updatedUrls.imageUrl);
              await deleteS3Image(updatedUrls.thumbnailUrl);
            }
            return res.status(404).json({ message: "Card not found" });
          }

          // Cleanup old images if new ones uploaded
          if (updatedUrls && originalCard) {
            try {
              if (originalCard.imageUrl) {
                await deleteS3Image(originalCard.imageUrl);
              }
              if (originalCard.thumbnailUrl) {
                await deleteS3Image(originalCard.thumbnailUrl);
              }
            } catch (cleanupError) {
              console.error("Failed to cleanup old images:", cleanupError);
            }
          }

          // Return updated card
          const updatedCard = await collection.findOne({
            _id: new ObjectId(cardId)
          });
          res.status(200).json(updatedCard);
        } catch (error) {
          console.error("Card update error:", error.name, error.message);
          console.error("Error stack:", error.stack);

          // Cleanup new images on failure
          if (updatedUrls) {
            try {
              await deleteS3Image(updatedUrls.imageUrl);
              await deleteS3Image(updatedUrls.thumbnailUrl);
            } catch (cleanupError) {
              console.error("Failed to cleanup uploaded images:", cleanupError);
            }
          }

          if (error.message.includes("File too large")) {
            return res
              .status(400)
              .json({ message: "File too large. Maximum size is 10MB" });
          }

          if (error.message.includes("Invalid file type")) {
            return res.status(400).json({ message: error.message });
          }

          return res.status(500).json({ message: "Failed to update card" });
        }
      });
    } else if (req.method === "DELETE") {
      const cardId = req.url.split("/").pop() || req.body.id;

      if (!cardId) {
        return res.status(400).json({ message: "Card ID required" });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(cardId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.status(200).json({ message: "Card deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin cards error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (client) await client.close();
  }
}
