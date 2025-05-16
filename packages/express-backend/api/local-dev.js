import http from "http";
import { URL } from "url";
import indexHandler from "./index.js";
import cardsNextHandler from "./cards/next.js";
import cardsGuessHandler from "./cards/guess.js";
import authLoginHandler from "./auth/login.js";
import authSignupHandler from "./auth/signup.js";
import adminCardsHandler from "./admin/cards.js";

// Mock req and res objects that simulate Express functionality
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

// Create a simple HTTP server to route requests to the appropriate handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Collect request body data
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    // Parse body if it exists
    if (body && req.headers["content-type"] === "application/json") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    // Create mock req and res objects for the handlers
    const mockReq = createMockReq(req.url, req.method, body, req.headers);
    const mockRes = createMockRes();

    try {
      // Route to the appropriate handler
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

      // Send the response
      res.statusCode = mockRes.statusCode;

      // Set headers
      if (mockRes.headers) {
        for (const [key, value] of Object.entries(mockRes.headers)) {
          res.setHeader(key, value);
        }
      }

      // Set content type if not already set
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }

      // Send the response body
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
  console.log(`Available endpoints:`);
  console.log(`  GET  /`);
  console.log(`  GET  /api/cards/next`);
  console.log(`  POST /api/cards/guess`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/auth/signup`);
  console.log(`  GET  /api/admin/cards`);
  console.log(`  POST /api/admin/cards`);
});
