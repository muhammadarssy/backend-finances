import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import { CreateTagInput } from "../validators/tag.js";

export async function listTags(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tags;
}

export async function getTagById(tagId: string, userId: string) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  if (tag.userId !== userId) {
    throw new ForbiddenError("You don't have access to this tag");
  }

  return tag;
}

export async function createTag(userId: string, data: CreateTagInput) {
  // Check if tag with same name already exists for this user
  const existingTag = await prisma.tag.findUnique({
    where: {
      userId_name: {
        userId,
        name: data.name,
      },
    },
  });

  if (existingTag) {
    throw new ValidationError("Tag with this name already exists");
  }

  const tag = await prisma.tag.create({
    data: {
      userId,
      name: data.name,
    },
  });

  return tag;
}

export async function deleteTag(tagId: string, userId: string) {
  // Verify ownership
  await getTagById(tagId, userId);

  // Delete tag (cascade will handle TransactionTag)
  await prisma.tag.delete({
    where: { id: tagId },
  });

  return { success: true };
}
