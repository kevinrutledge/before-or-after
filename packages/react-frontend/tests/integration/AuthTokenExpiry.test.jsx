import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret";

describe("JWT Token Utility", () => {
  it("should sign and verify a token with payload", () => {
    const payload = { email: "test@example.com", role: "user", id: "123" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    // Token should be a string
    expect(typeof token).toBe("string");

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.id).toBe(payload.id);
  });

  it("should fail verification with wrong secret", () => {
    const payload = { email: "test@example.com" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    expect(() => {
      jwt.verify(token, "wrong-secret");
    }).toThrow();
  });

  it("should expire token after given time", async () => {
    const payload = { email: "test@example.com" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1s" });

    // Wait for token to expire
    await new Promise((r) => setTimeout(r, 1100));

    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow(/jwt expired/);

    expect(() => {
      jwt.verify(token, "wrong-secret");
    }).toThrow("invalid signature");
  });

  it("should throw for a malformed token", () => {
    expect(() => {
      jwt.verify("not.a.valid.token", JWT_SECRET);
    }).toThrow();
  });

  it("should throw if no token is provided", () => {
    expect(() => {
      jwt.verify(undefined, JWT_SECRET);
    }).toThrow();
  });

  it("should verify a token with no expiry", () => {
    const payload = { email: "test@example.com" };
    const token = jwt.sign(payload, JWT_SECRET); // no expiresIn
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.email).toBe(payload.email);
  });

  it("should include custom claims in the token", () => {
    const payload = { email: "test@example.com", role: "admin" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.role).toBe("admin");
  });
});
