import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
} from "../auth.js";

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
        name: "Test User",
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it("should reject short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "short",
        name: "Test User",
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        email: "test@example.com",
        // missing password and name
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("should reject missing password", () => {
      const invalidData = {
        email: "test@example.com",
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });
});
