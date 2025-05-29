import { corsHandler } from "../_cors.js";
import { getLossGifsCollection } from "../../models/LossGif.js";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import { ObjectId } from "mongodb";

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
    } else if (req.method === "POST") {
      const { category, streakThreshold, imageUrl, thumbnailUrl } = req.body;

      if (!category || !streakThreshold || !imageUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newLossGif = {
        category,
        streakThreshold: parseInt(streakThreshold),
        imageUrl,
        thumbnailUrl: thumbnailUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newLossGif);
      res.status(201).json({ ...newLossGif, _id: result.insertedId });
    } else if (req.method === "PUT") {
      const lossGifId = req.url.split("/").pop();

      if (!lossGifId || !ObjectId.isValid(lossGifId)) {
        return res.status(400).json({ message: "Valid loss GIF ID required" });
      }

      const { category, streakThreshold, imageUrl, thumbnailUrl } = req.body;

      if (!category || !streakThreshold || !imageUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updateData = {
        category,
        streakThreshold: parseInt(streakThreshold),
        imageUrl,
        thumbnailUrl: thumbnailUrl || null,
        updatedAt: new Date()
      };

      const result = await collection.updateOne(
        { _id: new ObjectId(lossGifId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Loss GIF not found" });
      }

      // Return updated loss GIF
      const updatedLossGif = await collection.findOne({
        _id: new ObjectId(lossGifId)
      });
      res.status(200).json(updatedLossGif);
    } else if (req.method === "DELETE") {
      const lossGifId = req.url.split("/").pop() || req.body.id;

      if (!lossGifId) {
        return res.status(400).json({ message: "Loss GIF ID required" });
      }

      const result = await collection.deleteOne({
        _id: new ObjectId(lossGifId)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Loss GIF not found" });
      }

      res.status(200).json({ message: "Loss GIF deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin loss GIFs error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (client) await client.close();
  }
}
