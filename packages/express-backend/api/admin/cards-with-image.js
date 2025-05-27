import { corsHandler } from "../_cors.js";
import { getCardsCollection } from "../../models/Card.js";
import { verifyToken, adminOnly } from "../../middleware/auth.js";
import {
  processImage,
  validateImageFile
} from "../../services/imageProcessor.js";
import { uploadImagePair, deleteS3Image } from "../../services/s3Service.js";
import { parseMultipartData } from "../../utils/multipartParser.js";

/**
 * Create card with image upload in single atomic operation.
 */
export default async function handler(req, res) {
  if (corsHandler(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
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

  // Parse multipart form data
  const chunks = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", async () => {
    let client;
    let uploadedUrls = null;

    try {
      const bodyBuffer = Buffer.concat(chunks);
      const contentType = req.headers["content-type"] || "";

      if (!contentType.includes("multipart/form-data")) {
        return res
          .status(400)
          .json({ message: "Multipart form data required" });
      }

      const parsed = parseMultipartData(bodyBuffer, contentType);
      if (!parsed) {
        return res.status(400).json({ message: "Failed to parse form data" });
      }

      const { files, fields } = parsed;

      // Validate required fields
      const { title, year, month, category, sourceUrl, cropMode } = fields;
      if (!title || !year || !month || !category || !sourceUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate image file
      if (!files.image) {
        return res.status(400).json({ message: "Image file required" });
      }

      validateImageFile(files.image);

      // Process and upload image with crop mode
      const { thumbnail, large } = await processImage(
        files.image.buffer,
        cropMode
      );
      uploadedUrls = await uploadImagePair(thumbnail, large);

      // Create card record
      const { client: dbClient, collection } = await getCardsCollection();
      client = dbClient;

      const newCard = {
        title,
        year: parseInt(year),
        month: parseInt(month),
        imageUrl: uploadedUrls.imageUrl,
        thumbnailUrl: uploadedUrls.thumbnailUrl,
        sourceUrl,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newCard);

      res.status(201).json({
        ...newCard,
        _id: result.insertedId
      });
    } catch (error) {
      console.error("Card creation error:", error);

      // Cleanup uploaded images on failure
      if (uploadedUrls) {
        try {
          await deleteS3Image(uploadedUrls.imageUrl);
          await deleteS3Image(uploadedUrls.thumbnailUrl);
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

      return res.status(500).json({ message: "Failed to create card" });
    } finally {
      if (client) await client.close();
    }
  });
}
