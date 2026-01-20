import prisma from "../config/database.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../utils/errors.js";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ArchiveCategoryInput,
} from "../validators/category.js";
import { CategoryType } from "@prisma/client";

export async function listCategories(
  userId: string,
  filters: {
    type?: CategoryType;
    includeChildren?: boolean;
  }
) {
  const where: any = {
    userId,
    parentId: filters.includeChildren ? undefined : null,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  const categories = await prisma.category.findMany({
    where,
    include: {
      parent: true,
      children: filters.includeChildren
        ? {
            where: {
              isArchived: false,
            },
          }
        : false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
}

export async function getCategoryById(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      parent: true,
      children: true,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (category.userId !== userId) {
    throw new ForbiddenError("You don't have access to this category");
  }

  return category;
}

export async function createCategory(userId: string, data: CreateCategoryInput) {
  // Validate parent if provided
  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new NotFoundError("Parent category not found");
    }

    if (parent.userId !== userId) {
      throw new ForbiddenError("You don't have access to parent category");
    }

    if (parent.type !== data.type) {
      throw new ValidationError("Parent category type must match child category type");
    }
  }

  const category = await prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      parentId: data.parentId || null,
      isArchived: false,
    },
    include: {
      parent: true,
    },
  });

  return category;
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  data: UpdateCategoryInput
) {
  // Verify ownership
  const existingCategory = await getCategoryById(categoryId, userId);

  // Validate parent if provided
  if (data.parentId !== undefined) {
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new NotFoundError("Parent category not found");
      }

      if (parent.userId !== userId) {
        throw new ForbiddenError("You don't have access to parent category");
      }

      if (parent.type !== existingCategory.type) {
        throw new ValidationError("Parent category type must match child category type");
      }

      // Prevent circular reference
      if (data.parentId === categoryId) {
        throw new ValidationError("Category cannot be its own parent");
      }
    }
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    },
    include: {
      parent: true,
      children: true,
    },
  });

  return category;
}

export async function archiveCategory(
  categoryId: string,
  userId: string,
  data: ArchiveCategoryInput
) {
  // Verify ownership
  await getCategoryById(categoryId, userId);

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      isArchived: data.isArchived,
    },
    include: {
      parent: true,
      children: true,
    },
  });

  return category;
}
