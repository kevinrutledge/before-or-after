import http from "http";
import { URL } from "url";
import { corsHandler } from "./api/_cors.js";
import { parseMultipartData } from "./utils/multipartParser.js";
import indexHandler from "./api/index.js";
import cardsNextHandler from "./api/cards/next.js";
import cardsGuessHandler from "./api/cards/guess.js";
import cardsAllHandler from "./api/cards/all.js";
import lossGifsCurrentHandler from "./api/loss-gifs/current.js";
import authLoginHandler from "./api/auth/login.js";
import authSignupHandler from "./api/auth/signup.js";
import authForgotPasswordHandler from "./api/auth/forgot-password.js";
import authVerifyCodeHandler from "./api/auth/verify-code.js";
import authResetPasswordHandler from "./api/auth/reset-password.js";
import adminCardsHandler from "./api/admin/cards.js";
import adminLossGifsHandler from "./api/admin/loss-gifs.js";
import scoresUpdateHandler from "./api/scores/update.js";
import leaderboardHandler from "./api/leaderboard.js";
import { processImage, validateImageFile } from "./services/imageProcessor.js";
import { uploadImagePair, deleteS3Image } from "./services/s3Service.js";
import jwt from "jsonwebtoken";
import getScoresHandler from "./api/scores/get.js";

/**
 * Create mock request object with Express-like properties.
 */
const createMockReq = (url, method, body = null, headers = {}) => {
  const parsedUrl = new URL(url, "http://localhost");
  return {
    url,
    method,
    body,
    headers,
    query: Object.fromEntries(parsedUrl.searchParams)
  };
};

/**
 * Create mock response object with Express-like methods.
 */
const createMockRes = () => {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    send: (data) => {
      res.body = data;
      return res;
    },
    json: (data) => {
      res.body = JSON.stringify(data);
      return res;
    },
    setHeader: (name, value) => {
      res.headers = res.headers || {};
      res.headers[name] = value;
      return res;
    },
    end: () => {
      return res;
    },
    headers: {},
    statusCode: 200
  };
  return res;
};

/**
 * Handle card deletion with S3 image cleanup.
 */
const handleCardDelete = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Authentication required" }));
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Token expired" }));
      return;
    }

    if (decoded.role !== "admin") {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Admin access required" }));
      return;
    }
  } catch {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Invalid token" }));
    return;
  }

  const cardId = req.url.split("/").pop();
  if (!cardId) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Card ID required" }));
    return;
  }

  let client = null;

  try {
    const { getCardsCollection } = await import("./models/Card.js");
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    const { ObjectId } = await import("mongodb");
    const card = await collection.findOne({ _id: new ObjectId(cardId) });

    if (!card) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Card not found" }));
      return;
    }

    const result = await collection.deleteOne({ _id: new ObjectId(cardId) });

    if (result.deletedCount === 0) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Card not found" }));
      return;
    }

    try {
      if (card.imageUrl) {
        await deleteS3Image(card.imageUrl);
      }
      if (card.thumbnailUrl) {
        await deleteS3Image(card.thumbnailUrl);
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup S3 images:", cleanupError);
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Card deleted successfully" }));
  } catch (error) {
    console.error("Card deletion error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Failed to delete card" }));
  } finally {
    if (client) await client.close();
  }
};

const handleCardUpdate = async (req, res, fileData, fields) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Authentication required" }));
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Token expired" }));
      return;
    }

    if (decoded.role !== "admin") {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Admin access required" }));
      return;
    }
  } catch {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Invalid token" }));
    return;
  }

  const cardId = req.url.split("/").pop();
  if (!cardId) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Card ID required" }));
    return;
  }

  const { title, year, month, category, sourceUrl, cropMode } = fields || {};
  if (!title || !year || !month || !category || !sourceUrl) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Missing required fields" }));
    return;
  }

  let updatedUrls = null;
  let client = null;
  let originalCard = null;

  try {
    const { getCardsCollection } = await import("./models/Card.js");
    const { client: dbClient, collection } = await getCardsCollection();
    client = dbClient;

    const { ObjectId } = await import("mongodb");
    originalCard = await collection.findOne({ _id: new ObjectId(cardId) });
    if (!originalCard) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Card not found" }));
      return;
    }

    if (fileData && fileData.image) {
      validateImageFile(fileData.image);
      const { thumbnail, large } = await processImage(
        fileData.image.buffer,
        cropMode
      );
      updatedUrls = await uploadImagePair(thumbnail, large);
    }

    const updateData = {
      title,
      year: parseInt(year),
      month: parseInt(month),
      category,
      sourceUrl,
      updatedAt: new Date()
    };

    if (updatedUrls) {
      updateData.imageUrl = updatedUrls.imageUrl;
      updateData.thumbnailUrl = updatedUrls.thumbnailUrl;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(cardId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      if (updatedUrls) {
        await deleteS3Image(updatedUrls.imageUrl);
        await deleteS3Image(updatedUrls.thumbnailUrl);
      }
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Card not found" }));
      return;
    }

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

    const updatedCard = await collection.findOne({ _id: new ObjectId(cardId) });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(updatedCard));
  } catch (error) {
    console.error("Card update error:", error);

    if (updatedUrls) {
      try {
        await deleteS3Image(updatedUrls.imageUrl);
        await deleteS3Image(updatedUrls.thumbnailUrl);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded images:", cleanupError);
      }
    }

    if (error.message.includes("File too large")) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ message: "File too large. Maximum size is 10MB" })
      );
      return;
    }

    if (error.message.includes("Invalid file type")) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: error.message }));
      return;
    }

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Failed to update card" }));
  } finally {
    if (client) await client.close();
  }
};

const handleAtomicCardCreation = async (fileData, fields, headers) => {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Authentication required" })
    };
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Token expired" })
      };
    }

    if (decoded.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Admin access required" })
      };
    }
  } catch {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid token" })
    };
  }

  const { title, year, month, category, sourceUrl, cropMode } = fields || {};
  if (!title || !year || !month || !category || !sourceUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" })
    };
  }

  if (!fileData || !fileData.image) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Image file required" })
    };
  }

  let uploadedUrls = null;
  let client = null;

  try {
    const file = fileData.image;

    validateImageFile(file);
    const { thumbnail, large } = await processImage(file.buffer, cropMode);
    uploadedUrls = await uploadImagePair(thumbnail, large);

    const { getCardsCollection } = await import("./models/Card.js");
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

    return {
      statusCode: 201,
      body: JSON.stringify({
        ...newCard,
        _id: result.insertedId
      })
    };
  } catch (error) {
    console.error("Atomic card creation error:", error);

    if (uploadedUrls) {
      try {
        await deleteS3Image(uploadedUrls.imageUrl);
        await deleteS3Image(uploadedUrls.thumbnailUrl);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded images:", cleanupError);
      }
    }

    if (error.message.includes("File too large")) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "File too large. Maximum size is 10MB"
        })
      };
    }

    if (error.message.includes("Invalid file type")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to create card" })
    };
  } finally {
    if (client) await client.close();
  }
};

// Create HTTP server for production
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Handle CORS using shared handler
  if (corsHandler(req, res)) {
    return;
  }

  // Health endpoint for keep-alive
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // Collect request body data as buffer for multipart support
  const chunks = [];
  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", async () => {
    const bodyBuffer = Buffer.concat(chunks);
    const contentType = req.headers["content-type"] || "";
    let parsedBody = null;
    let fileData = null;

    // Parse body based on content type
    if (contentType.includes("multipart/form-data")) {
      const parsed = parseMultipartData(bodyBuffer, contentType);
      if (parsed) {
        parsedBody = parsed.fields;
        fileData = parsed.files;
      }
    } else if (contentType === "application/json" && bodyBuffer.length > 0) {
      try {
        parsedBody = JSON.parse(bodyBuffer.toString());
      } catch {
        parsedBody = {};
      }
    }

    try {
      let mockRes;

      // Handle atomic card creation
      if (path === "/api/admin/cards-with-image") {
        const atomicResult = await handleAtomicCardCreation(
          fileData,
          parsedBody,
          req.headers
        );
        res.statusCode = atomicResult.statusCode;
        res.setHeader("Content-Type", "application/json");
        res.end(atomicResult.body);
        return;
      }

      // Create Express-compatible request and response objects
      const mockReq = createMockReq(
        req.url,
        req.method,
        parsedBody,
        req.headers
      );
      mockRes = createMockRes();

      // Route to appropriate handler
      if (path === "/") {
        await indexHandler(mockReq, mockRes);
      } else if (path === "/api/cards/next") {
        await cardsNextHandler(mockReq, mockRes);
      } else if (path === "/api/cards/guess") {
        await cardsGuessHandler(mockReq, mockRes);
      } else if (path === "/api/cards/all") {
        await cardsAllHandler(mockReq, mockRes);
      } else if (path === "/api/loss-gifs/current") {
        await lossGifsCurrentHandler(mockReq, mockRes);
      } else if (path === "/api/auth/login") {
        await authLoginHandler(mockReq, mockRes);
      } else if (path === "/api/auth/signup") {
        await authSignupHandler(mockReq, mockRes);
      } else if (path === "/api/auth/forgot-password") {
        await authForgotPasswordHandler(mockReq, mockRes);
      } else if (path === "/api/auth/verify-code") {
        await authVerifyCodeHandler(mockReq, mockRes);
      } else if (path === "/api/auth/reset-password") {
        await authResetPasswordHandler(mockReq, mockRes);
      } else if (path === "/api/scores/update") {
        await scoresUpdateHandler(mockReq, mockRes);
      } else if (path === "/api/scores/get" && req.method === "GET"){
        await getScoresHandler(mockReq, mockRes);
      } else if (path === "/api/leaderboard") {
        await leaderboardHandler(mockReq, mockRes);
      } else if (path.startsWith("/api/admin/cards/") && req.method === "PUT") {
        await handleCardUpdate(req, res, fileData, parsedBody);
        return;
      } else if (
        path.startsWith("/api/admin/cards/") &&
        req.method === "DELETE"
      ) {
        await handleCardDelete(req, res);
        return;
      } else if (path === "/api/admin/cards") {
        await adminCardsHandler(mockReq, mockRes);
      } else if (
        path.startsWith("/api/admin/loss-gifs/") &&
        req.method === "PUT"
      ) {
        mockReq.fileData = fileData;
        await adminLossGifsHandler(mockReq, mockRes);
      } else if (
        path.startsWith("/api/admin/loss-gifs/") &&
        req.method === "DELETE"
      ) {
        mockReq.fileData = fileData;
        await adminLossGifsHandler(mockReq, mockRes);
      } else if (path === "/api/admin/loss-gifs") {
        mockReq.fileData = fileData;
        await adminLossGifsHandler(mockReq, mockRes);
      } else {
        mockRes.status(404).send("Not Found");
      }

      // Set response status code
      res.statusCode = mockRes.statusCode;

      // Apply response headers
      if (mockRes.headers) {
        for (const [key, value] of Object.entries(mockRes.headers)) {
          res.setHeader(key, value);
        }
      }

      // Set default content type when not specified
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }

      // Send response body
      res.end(mockRes.body);
    } catch (error) {
      console.error("Server error:", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`\n  ➜  API Server: http://localhost:${PORT}/`);
  console.log(`  ➜  Backend:    Ready on port ${PORT}`);
});
