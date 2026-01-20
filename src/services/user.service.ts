import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { UpdateProfileInput } from "../validators/user.js";

export async function getCurrentUser(userId: string) {
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
    throw new NotFoundError("User not found");
  }

  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.defaultCurrency && { defaultCurrency: data.defaultCurrency }),
      ...(data.timezone && { timezone: data.timezone }),
    },
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

  return updatedUser;
}
