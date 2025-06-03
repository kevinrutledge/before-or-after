import { corsHandler } from "../_cors.js";
import { getLossGifsCollection } from "../../models/LossGif.js";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import { ObjectId } from "mongodb";
import {
  processImage,
  validateImageFile
} from "../../services/imageProcessor.js";
import {
  uploadLossGifImagePair,
  deleteS3Image
} from "../../services/s3Service.js";

export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  // Apply existing auth middleware
  try {
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()));
    });

    await new Promise((resolve, reject) => {
      adminOnly(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch {
    return; // Middleware sent error response
  }

  let client;
  try {
    const { client: dbClient, collection } = await getLossGifsCollection();
    client = dbClient;

    if (req.method === "GET") {
      const { limit = 20, cursor } = req.query;
      const query = {};

      if (cursor) {
        query._id = { $gt: new ObjectId(cursor) };
      }

      const lossGifs = await collection
        .find(query)
        .sort({ streakThreshold: 1 })
        .limit(parseInt(limit))
        .toArray();

      res.status(200).json(lossGifs);
    } else if (req.method === "PUT") {
      let updatedUrls = null;
      let originalLossGif = null;

      const lossGifId = req.url.split("/").pop();

      if (!lossGifId || !ObjectId.isValid(lossGifId)) {
        return res.status(400).json({ message: "Invalid loss GIF ID" });
      }

      // Get original loss GIF for cleanup
      originalLossGif = await collection.findOne({
        _id: new ObjectId(lossGifId)
      });

      if (!originalLossGif) {
        return res.status(404).json({ message: "Loss GIF not found" });
      }

      // Extract fields and files from pre-parsed request data
      const fields = req.body || {};
      const fileData = req.fileData || {};

      // Validate required text fields
      const { category, scoreRange, streakThreshold } = fields;

      if (!category || !scoreRange || !streakThreshold) {
        return res.status(400).json({
          message: "Missing required fields",
          received: { category, scoreRange, streakThreshold }
        });
      }

      // Process new image when provided
      if (fileData.image) {
        validateImageFile(fileData.image);

        const processed = await processImage(
          fileData.image.buffer,
          "scale",
          fileData.image.mimetype
        );

        updatedUrls = await uploadLossGifImagePair(
          processed.thumbnail,
          processed.large,
          processed.originalMimeType
        );
      }

      // Build update object
      const updateData = {
        category,
        scoreRange,
        streakThreshold: parseInt(streakThreshold),
        updatedAt: new Date()
      };

      // Add image URLs when new image uploaded
      if (updatedUrls) {
        updateData.imageUrl = updatedUrls.imageUrl;
        updateData.thumbnailUrl = updatedUrls.thumbnailUrl;
      }

      // Update loss GIF in database
      const result = await collection.updateOne(
        { _id: new ObjectId(lossGifId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        // Cleanup new images when update failed
        if (updatedUrls) {
          try {
            await deleteS3Image(updatedUrls.imageUrl);
            await deleteS3Image(updatedUrls.thumbnailUrl);
          } catch (cleanupError) {
            console.error("Failed to cleanup uploaded images:", cleanupError);
          }
        }
        return res.status(404).json({ message: "Loss GIF not found" });
      }

      // Cleanup old images when new ones uploaded
      if (updatedUrls && originalLossGif) {
        try {
          if (originalLossGif.imageUrl) {
            await deleteS3Image(originalLossGif.imageUrl);
          }
          if (originalLossGif.thumbnailUrl) {
            await deleteS3Image(originalLossGif.thumbnailUrl);
          }
        } catch (cleanupError) {
          console.error("Failed to cleanup old images:", cleanupError);
        }
      }

      // Return updated loss GIF
      const updatedLossGif = await collection.findOne({
        _id: new ObjectId(lossGifId)
      });
      res.status(200).json(updatedLossGif);
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin loss GIFs handler error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (client) await client.close();
  }
}
