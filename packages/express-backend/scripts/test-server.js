import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from the correct location
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testServerHealth() {
  try {
    console.log("Testing basic server health...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("http://localhost:8000/", {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response body:", text);
    console.log("Basic server health check passed!");
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(
        "Request timed out after 5 seconds. Server may be unresponsive."
      );
    } else {
      console.error("Failed to connect to server:", error.message);
    }
  }
}

testServerHealth();
