import request from "supertest";
import jwt from "jsonwebtoken";
import assert from "assert";

//import app from "../../server.js"; // Adjust path if your Express app is exported elsewhere
import server from "../../../express-backend/server.js"; // Ensure server is imported correctly
// Use the same secret as your backend .env for test tokens
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "test-secret"; // Fallback for testing

// Helper to create a valid admin JWT
function getAdminToken() {
  return jwt.sign(
    {
      email: "admin@before-or-after.com",
      role: "admin",
      id: "adminid123"
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Admin Card API Error Handling", () => {
  test("placeholder test", () => {
    expect(true).toBe(true);
  });
});

describe("Admin Card API Error Handling", () => {
  let adminToken;
  assert(true); // Placeholder to ensure the test suite runs

  beforeAll(() => {
    adminToken = getAdminToken();
  });

  it("returns 401 if no token is provided", async () => {
    const res = await request(app)
      .post("/api/admin/cards")
      .send({ title: "Test", year: 2020, month: 1, category: "movie", sourceUrl: "https://example.com" });
    expect(res.status).toBe(401);
    expect(res.body.message || res.body.error).toMatch(/unauthorized|token/i);
  });

  it("returns 403 if user is not admin", async () => {
    const userToken = jwt.sign(
      { email: "user@example.com", role: "user", id: "userid123" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .post("/api/admin/cards")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Test", year: 2020, month: 1, category: "movie", sourceUrl: "https://example.com" });
    expect(res.status).toBe(403);
    expect(res.body.message || res.body.error).toMatch(/admin/i);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await request(app)
      .post("/api/admin/cards")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Incomplete Card" }); // Missing year, month, category, sourceUrl
    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error).toMatch(/required|missing/i);
  });

  it("returns 404 for updating non-existent card", async () => {
    const res = await request(app)
      .put("/api/admin/cards/nonexistentid123")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated Title", year: 2021, month: 2, category: "movie", sourceUrl: "https://example.com" });
    expect([404, 400]).toContain(res.status); // Some APIs use 400 for bad id
    expect(res.body.message || res.body.error).toMatch(/not found|no card/i);
  });

  it("returns 404 for deleting non-existent card", async () => {
    const res = await request(app)
      .delete("/api/admin/cards/nonexistentid123")
      .set("Authorization", `Bearer ${adminToken}`);
    expect([404, 400]).toContain(res.status);
    expect(res.body.message || res.body.error).toMatch(/not found|no card/i);
  });

  it("returns 400 for invalid year/month values", async () => {
    const res = await request(app)
      .post("/api/admin/cards")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Bad Date", year: "notayear", month: 99, category: "movie", sourceUrl: "https://example.com" });
    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error).toMatch(/year|month|invalid/i);
  });
});