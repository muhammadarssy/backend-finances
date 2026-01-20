import { config } from "dotenv";

config();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  HOST: process.env.HOST || "0.0.0.0",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
} as const;

// Validate required environment variables
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

if (env.NODE_ENV === "production" && env.JWT_SECRET === "change-me-in-production") {
  throw new Error("JWT_SECRET must be set in production");
}
