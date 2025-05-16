import http from "http";
import { URL } from "url";
import { corsHandler } from "./_cors.js";
import indexHandler from "./index.js";
import cardsNextHandler from "./cards/next.js";
import cardsGuessHandler from "./cards/guess.js";
import authLoginHandler from "./auth/login.js";
import authSignupHandler from "./auth/signup.js";
import adminCardsHandler from "./admin/cards.js";

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

// Create HTTP server to simulate API endpoints
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Handle CORS using shared handler
  if (corsHandler(req, res)) {
    return;
  }

  // Collect request body data
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    // Parse JSON body when present
    if (body && req.headers["content-type"] === "application/json") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    // Create Express-compatible request and response objects
    const mockReq = createMockReq(req.url, req.method, body, req.headers);
    const mockRes = createMockRes();

    try {
      // Route requests to appropriate handler
      if (path === "/") {
        await indexHandler(mockReq, mockRes);
      } else if (path === "/api/cards/next") {
        await cardsNextHandler(mockReq, mockRes);
      } else if (path === "/api/cards/guess") {
        await cardsGuessHandler(mockReq, mockRes);
      } else if (path === "/api/auth/login") {
        await authLoginHandler(mockReq, mockRes);
      } else if (path === "/api/auth/signup") {
        await authSignupHandler(mockReq, mockRes);
      } else if (path === "/api/admin/cards") {
        await adminCardsHandler(mockReq, mockRes);
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

      // Set default content type if not specified
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }

      // Send response body
      res.end(mockRes.body);
    } catch (error) {
      console.error("Error handling request:", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Local development server running at http://localhost:${PORT}`);
});
