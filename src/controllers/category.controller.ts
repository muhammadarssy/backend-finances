import { FastifyRequest, FastifyReply } from "fastify";
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  archiveCategory,
} from "../services/category.service.js";
import {
  createCategorySchema,
  updateCategorySchema,
  archiveCategorySchema,
} from "../validators/category.js";
import { sendSuccess } from "../utils/response.js";
import { CategoryType } from "@prisma/client";

export async function listCategoriesHandler(
  request: FastifyRequest<{
    Querystring: {
      type?: CategoryType;
      includeChildren?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    type: request.query.type,
    includeChildren: request.query.includeChildren === "true",
  };

  const categories = await listCategories(userId, filters);

  return sendSuccess(reply, categories, "OK");
}

export async function getCategoryHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const category = await getCategoryById(id, userId);

  return sendSuccess(reply, category, "OK");
}

export async function createCategoryHandler(
  request: FastifyRequest<{
    Body: {
      name: string;
      type: CategoryType;
      icon?: string;
      color?: string;
      parentId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createCategorySchema.parse(request.body);

  const category = await createCategory(userId, validatedData);

  return sendSuccess(reply, category, "Category created successfully", 201);
}

export async function updateCategoryHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      name?: string;
      icon?: string;
      color?: string;
      parentId?: string | null;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateCategorySchema.parse(request.body);

  const category = await updateCategory(id, userId, validatedData);

  return sendSuccess(reply, category, "Category updated successfully");
}

export async function archiveCategoryHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      isArchived: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = archiveCategorySchema.parse(request.body);

  const category = await archiveCategory(id, userId, validatedData);

  return sendSuccess(reply, category, "Category archived status updated");
}
