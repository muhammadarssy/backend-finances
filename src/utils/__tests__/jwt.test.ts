import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { generateToken, verifyToken } from "../jwt.js";

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
process.env.JWT_EXPIRES_IN = "1h";

describe("JWT Utilities", () => {
  const testPayload = { id: "user123", email: "test@example.com" };

  it("should generate a valid JWT token", () => {
    const token = generateToken(testPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
  });

  it("should verify a valid token", () => {
    const token = generateToken(testPayload);
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.id).toBe(testPayload.id);
    expect(decoded.email).toBe(testPayload.email);
  });

  it("should throw error for invalid token", () => {
    const invalidToken = "invalid.token.here";
    expect(() => verifyToken(invalidToken)).toThrow();
  });

  it("should throw error for expired token", async () => {
    // Create a token with very short expiry
    const shortExpiryToken = jwt.sign(
      testPayload,
      process.env.JWT_SECRET!,
      { expiresIn: "1ms" }
    );
    
    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    expect(() => verifyToken(shortExpiryToken)).toThrow();
  });

  it("should generate different tokens for same payload (due to iat)", () => {
    const token1 = generateToken(testPayload);
    const token2 = generateToken(testPayload);
    // Tokens should be different due to different issued at time
    expect(token1).not.toBe(token2);
  });
});
