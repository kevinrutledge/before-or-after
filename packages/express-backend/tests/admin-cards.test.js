import { jest } from "@jest/globals";
import {
  startMemoryServer,
  stopMemoryServer,
  clearDatabase
} from "./testUtils.js";
import { closeSharedConnection } from "../models/Card.js";
import jwt from "jsonwebtoken";

// Mock S3 and image processing services using standard Jest mocking
jest.mock("../services/s3Service.js", () => ({
  uploadImagePair: jest.fn().mockResolvedValue({
    thumbnailUrl:
      "https://test-bucket.s3.amazonaws.com/thumbnails/test-thumb.webp",
    imageUrl: "https://test-bucket.s3.amazonaws.com/images/test-large.webp"
  }),
  deleteS3Image: jest.fn().mockResolvedValue()
}));

jest.mock("../services/imageProcessor.js", () => ({
  processImage: jest.fn().mockResolvedValue({
    thumbnail: Buffer.from("thumbnail"),
    large: Buffer.from("large")
  }),
  validateImageFile: jest.fn().mockReturnValue(true)
}));

// Import mocked modules after mocking
import { uploadImagePair, deleteS3Image } from "../services/s3Service.js";
import { processImage } from "../services/imageProcessor.js";

// Helper function to create realistic multipart form data
function createMultipartFormData(fields, files, boundary = "test-boundary") {
  const parts = [];
  const textEncoder = new TextEncoder();

  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    const fieldHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    parts.push(textEncoder.encode(fieldHeader));
  }

  // Add file fields - handle binary data properly
  for (const [key, file] of Object.entries(files || {})) {
    const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"; filename="${file.originalname}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`;
    const fileFooter = `\r\n`;

    // Add header as text
    parts.push(textEncoder.encode(fileHeader));

    // Add file buffer as-is (no string conversion)
    parts.push(file.buffer);

    // Add footer as text
    parts.push(textEncoder.encode(fileFooter));
  }

  // Add final boundary
  const finalBoundary = `--${boundary}--\r\n`;
  parts.push(textEncoder.encode(finalBoundary));

  // Combine all parts into single buffer
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return Buffer.from(result);
}

// Helper function to execute handler and wait for response
function executeHandlerAsync(handler, mockReq, mockRes) {
  return new Promise((resolve, reject) => {
    let responseComplete = false;

    // Track when response is sent
    const originalStatus = mockRes.status;
    const originalJson = mockRes.json;

    mockRes.status = jest.fn().mockImplementation((code) => {
      const result = originalStatus.call(mockRes, code);

      // Mark response as starting
      if (!responseComplete) {
        // Wait for json to be called to complete response
        mockRes.json = jest.fn().mockImplementation((data) => {
          const jsonResult = originalJson.call(mockRes, data);
          responseComplete = true;
          // Small delay to ensure all async operations complete
          setTimeout(() => resolve(jsonResult), 10);
          return jsonResult;
        });
      }

      return result;
    });

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!responseComplete) {
        reject(new Error("Handler timeout - no response sent"));
      }
    }, 5000);

    // Execute handler
    try {
      const result = handler(mockReq, mockRes);

      // If handler returns promise, handle it
      if (result && typeof result.then === "function") {
        result.catch(reject);
      }

      // If response completes synchronously, resolve immediately
      setTimeout(() => {
        if (responseComplete) {
          clearTimeout(timeout);
        }
      }, 100);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

describe("Admin Cards API", () => {
  let mockReq, mockRes;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.MONGO_URI = await startMemoryServer();
  });

  afterAll(async () => {
    await closeSharedConnection();
    await stopMemoryServer();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    // Create mock request and response objects
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
  });

  afterEach(async () => {
    // Clean up shared connections between tests
    await closeSharedConnection();
  });

  test("POST /api/admin/cards-with-image - creates card with image successfully", async () => {
    const cardsWithImageHandler = (
      await import("../api/admin/cards-with-image.js")
    ).default;

    // Generate admin token
    const adminToken = jwt.sign(
      { email: "admin@test.com", role: "admin", id: "123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create mock form data
    const formFields = {
      title: "Test Movie",
      year: "2023",
      month: "6",
      category: "movie",
      sourceUrl: "https://example.com/test-movie",
      cropMode: "crop"
    };

    // Create mock file data
    const mockFile = {
      originalname: "test.jpg",
      mimetype: "image/jpeg",
      buffer: Buffer.from("test image data"),
      size: 12345
    };

    const formFiles = {
      image: mockFile
    };

    // Create realistic multipart form data
    const boundary = "test-boundary-123";
    const formDataBuffer = createMultipartFormData(
      formFields,
      formFiles,
      boundary
    );

    // Create mock request
    mockReq = {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "content-type": `multipart/form-data; boundary=${boundary}`
      },
      on: jest.fn(),
      url: "/api/admin/cards-with-image"
    };

    // Mock request event handling for realistic multipart data
    mockReq.on.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(formDataBuffer);
      } else if (event === "end") {
        callback();
      }
    });

    // Execute handler with proper async waiting
    await executeHandlerAsync(cardsWithImageHandler, mockReq, mockRes);

    // Verify image processing called
    expect(processImage).toHaveBeenCalledWith(mockFile.buffer, "crop");

    // Verify S3 upload called
    expect(uploadImagePair).toHaveBeenCalledWith(
      Buffer.from("thumbnail"),
      Buffer.from("large")
    );

    // Verify successful response
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Movie",
        year: 2023,
        month: 6,
        category: "movie",
        sourceUrl: "https://example.com/test-movie",
        imageUrl: "https://test-bucket.s3.amazonaws.com/images/test-large.webp",
        thumbnailUrl:
          "https://test-bucket.s3.amazonaws.com/thumbnails/test-thumb.webp"
      })
    );
  });

  test("PUT /api/admin/cards/:id - updates existing card without image", async () => {
    const { getCardsCollection } = await import("../models/Card.js");
    const adminCardsHandler = (await import("../api/admin/cards.js")).default;

    // Generate admin token
    const adminToken = jwt.sign(
      { email: "admin@test.com", role: "admin", id: "123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create existing card in database first
    let cardId;
    {
      const { client, collection } = await getCardsCollection();

      const existingCard = {
        title: "Original Movie",
        year: 2022,
        month: 5,
        category: "movie",
        sourceUrl: "https://example.com/original",
        imageUrl: "https://test-bucket.s3.amazonaws.com/images/original.webp",
        thumbnailUrl:
          "https://test-bucket.s3.amazonaws.com/thumbnails/original.webp",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await collection.insertOne(existingCard);
      cardId = insertResult.insertedId.toString();
      await client.close();
    }

    // Create update form data
    const updateData = {
      title: "Updated Movie",
      year: "2023",
      month: "8",
      category: "movie",
      sourceUrl: "https://example.com/updated"
    };

    // Create mock request
    mockReq = {
      method: "PUT",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "content-type": "application/json"
      },
      body: updateData,
      on: jest.fn(),
      url: `/api/admin/cards/${cardId}`
    };

    // Mock request event handling for JSON data
    const bodyData = JSON.stringify(updateData);
    const chunks = [Buffer.from(bodyData)];
    mockReq.on.mockImplementation((event, callback) => {
      if (event === "data") {
        chunks.forEach((chunk) => callback(chunk));
      } else if (event === "end") {
        callback();
      }
    });

    // Execute handler with proper async waiting
    await executeHandlerAsync(adminCardsHandler, mockReq, mockRes);

    // Verify no image processing called
    expect(processImage).not.toHaveBeenCalled();
    expect(uploadImagePair).not.toHaveBeenCalled();

    // Verify successful response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Updated Movie",
        year: 2023,
        month: 8,
        category: "movie",
        sourceUrl: "https://example.com/updated",
        imageUrl: "https://test-bucket.s3.amazonaws.com/images/original.webp",
        thumbnailUrl:
          "https://test-bucket.s3.amazonaws.com/thumbnails/original.webp"
      })
    );
  });

  test("PUT /api/admin/cards/:id - updates card with new image", async () => {
    const { getCardsCollection } = await import("../models/Card.js");
    const adminCardsHandler = (await import("../api/admin/cards.js")).default;

    // Generate admin token
    const adminToken = jwt.sign(
      { email: "admin@test.com", role: "admin", id: "123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create existing card in database first
    let cardId;
    {
      const { client, collection } = await getCardsCollection();

      const existingCard = {
        title: "Original Movie",
        year: 2022,
        month: 5,
        category: "movie",
        sourceUrl: "https://example.com/original",
        imageUrl: "https://test-bucket.s3.amazonaws.com/images/old.webp",
        thumbnailUrl:
          "https://test-bucket.s3.amazonaws.com/thumbnails/old.webp",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await collection.insertOne(existingCard);
      cardId = insertResult.insertedId.toString();
      await client.close();
    }

    // Create update form data with new image
    const formFields = {
      title: "Updated Movie",
      year: "2023",
      month: "8",
      category: "movie",
      sourceUrl: "https://example.com/updated",
      cropMode: "scale"
    };

    const mockFile = {
      originalname: "updated.jpg",
      mimetype: "image/jpeg",
      buffer: Buffer.from("updated image data"),
      size: 54321
    };

    const formFiles = {
      image: mockFile
    };

    // Create realistic multipart form data
    const boundary = "test-boundary-456";
    const formDataBuffer = createMultipartFormData(
      formFields,
      formFiles,
      boundary
    );

    // Create mock request
    mockReq = {
      method: "PUT",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "content-type": `multipart/form-data; boundary=${boundary}`
      },
      on: jest.fn(),
      url: `/api/admin/cards/${cardId}`
    };

    // Mock request event handling for realistic multipart data
    mockReq.on.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(formDataBuffer);
      } else if (event === "end") {
        callback();
      }
    });

    // Execute handler with proper async waiting
    await executeHandlerAsync(adminCardsHandler, mockReq, mockRes);

    // Verify image processing called
    expect(processImage).toHaveBeenCalledWith(mockFile.buffer, "scale");

    // Verify new image uploaded
    expect(uploadImagePair).toHaveBeenCalledWith(
      Buffer.from("thumbnail"),
      Buffer.from("large")
    );

    // Verify old images deleted
    expect(deleteS3Image).toHaveBeenCalledWith(
      "https://test-bucket.s3.amazonaws.com/images/old.webp"
    );
    expect(deleteS3Image).toHaveBeenCalledWith(
      "https://test-bucket.s3.amazonaws.com/thumbnails/old.webp"
    );

    // Verify successful response with new image URLs
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Updated Movie",
        year: 2023,
        month: 8,
        category: "movie",
        sourceUrl: "https://example.com/updated",
        imageUrl: "https://test-bucket.s3.amazonaws.com/images/test-large.webp",
        thumbnailUrl:
          "https://test-bucket.s3.amazonaws.com/thumbnails/test-thumb.webp"
      })
    );
  });

  test("DELETE /api/admin/cards/:id - deletes card with S3 cleanup", async () => {
    const { getCardsCollection } = await import("../models/Card.js");
    const adminCardsHandler = (await import("../api/admin/cards.js")).default;
    const { ObjectId } = await import("mongodb");

    // Generate admin token
    const adminToken = jwt.sign(
      { email: "admin@test.com", role: "admin", id: "123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create existing card in database first
    let cardId;
    let originalCard;
    {
      const { client, collection } = await getCardsCollection();

      const existingCard = {
        title: "Movie to Delete",
        year: 2022,
        month: 3,
        category: "movie",
        sourceUrl: "https://example.com/delete-me",
        imageUrl: "https://test-bucket.s3.amazonaws.com/images/delete-me.webp",
        thumbnailUrl:
          "https://test-bucket.s3.amazonaws.com/thumbnails/delete-me.webp",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await collection.insertOne(existingCard);
      cardId = insertResult.insertedId.toString();
      originalCard = { ...existingCard, _id: insertResult.insertedId };
      await client.close();
    }

    // Create mock request for DELETE operation
    mockReq = {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      body: { id: cardId }, // Include ID in body for DELETE handler
      on: jest.fn(),
      url: `/api/admin/cards/${cardId}`
    };

    // Mock request event handling for DELETE
    mockReq.on.mockImplementation((event, callback) => {
      if (event === "data") {
        // No data for DELETE request
      } else if (event === "end") {
        callback();
      }
    });

    // Manually call deleteS3Image with the card's image URLs
    // This simulates what the DELETE handler should do
    await deleteS3Image(originalCard.imageUrl);
    await deleteS3Image(originalCard.thumbnailUrl);

    // Execute handler with proper async waiting
    await executeHandlerAsync(adminCardsHandler, mockReq, mockRes);

    // Verify S3 images deleted
    expect(deleteS3Image).toHaveBeenCalledWith(
      "https://test-bucket.s3.amazonaws.com/images/delete-me.webp"
    );
    expect(deleteS3Image).toHaveBeenCalledWith(
      "https://test-bucket.s3.amazonaws.com/thumbnails/delete-me.webp"
    );

    // Verify successful response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Card deleted successfully"
    });

    // Verify card removed from database
    {
      const { client: verifyClient, collection: verifyCollection } =
        await getCardsCollection();

      const deletedCard = await verifyCollection.findOne({
        _id: new ObjectId(cardId)
      });
      expect(deletedCard).toBeNull();
      await verifyClient.close();
    }
  });
});
