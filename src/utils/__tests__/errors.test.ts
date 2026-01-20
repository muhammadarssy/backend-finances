import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors.js";

describe("Error Classes", () => {
  it("should create AppError with message and status code", () => {
    const error = new AppError("Test error", 400);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error).toBeInstanceOf(Error);
  });

  it("should create ValidationError with 400 status", () => {
    const error = new ValidationError("Invalid input");
    expect(error.message).toBe("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should create NotFoundError with 404 status", () => {
    const error = new NotFoundError("Resource not found");
    expect(error.message).toBe("Resource not found");
    expect(error.statusCode).toBe(404);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should create ForbiddenError with 403 status", () => {
    const error = new ForbiddenError("Access denied");
    expect(error.message).toBe("Access denied");
    expect(error.statusCode).toBe(403);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should create UnauthorizedError with 401 status", () => {
    const error = new UnauthorizedError("Unauthorized");
    expect(error.message).toBe("Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error).toBeInstanceOf(AppError);
  });
});
