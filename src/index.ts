import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/database.js";

async function start() {
  try {
    // Build Fastify app
    const app = await buildApp();

    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected");

    // Start server
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📚 API Documentation available at http://${env.HOST}:${env.PORT}/docs`);
    console.log(`🏥 Health check available at http://${env.HOST}:${env.PORT}/health`);
  } catch (error) {
    console.error("Error starting server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

start();
