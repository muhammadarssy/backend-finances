import bcrypt from "bcrypt";
import prisma from "../config/database.js";
import { generateToken } from "../utils/jwt.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";
import { RegisterInput, LoginInput } from "../validators/auth.js";

export async function register(data: RegisterInput) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ValidationError("Email already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      defaultCurrency: true,
      timezone: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user,
  };
}

export async function login(data: LoginInput) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Verify password
  const isValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      defaultCurrency: user.defaultCurrency,
      timezone: user.timezone,
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      defaultCurrency: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return user;
}
