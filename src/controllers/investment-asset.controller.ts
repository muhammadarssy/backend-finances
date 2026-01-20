import { FastifyRequest, FastifyReply } from "fastify";
import {
  listInvestmentAssets,
  getInvestmentAssetById,
  createInvestmentAsset,
  updateInvestmentAsset,
} from "../services/investment-asset.service.js";
import {
  createInvestmentAssetSchema,
  updateInvestmentAssetSchema,
} from "../validators/investment-asset.js";
import { sendSuccess } from "../utils/response.js";
import { InvestmentAssetType } from "@prisma/client";

export async function listInvestmentAssetsHandler(
  request: FastifyRequest<{
    Querystring: {
      assetType?: InvestmentAssetType;
      q?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    assetType: request.query.assetType,
    q: request.query.q,
  };

  const assets = await listInvestmentAssets(userId, filters);

  return sendSuccess(reply, assets, "OK");
}

export async function getInvestmentAssetHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const asset = await getInvestmentAssetById(id, userId);

  return sendSuccess(reply, asset, "OK");
}

export async function createInvestmentAssetHandler(
  request: FastifyRequest<{
    Body: {
      symbol: string;
      name: string;
      assetType: InvestmentAssetType;
      exchange?: string | null;
      currency?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const validatedData = createInvestmentAssetSchema.parse(request.body);

  const asset = await createInvestmentAsset(userId, validatedData);

  return sendSuccess(reply, asset, "Investment asset created successfully", 201);
}

export async function updateInvestmentAssetHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      symbol?: string;
      name?: string;
      assetType?: InvestmentAssetType;
      exchange?: string | null;
      currency?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  const validatedData = updateInvestmentAssetSchema.parse(request.body);

  const asset = await updateInvestmentAsset(id, userId, validatedData);

  return sendSuccess(reply, asset, "Investment asset updated successfully");
}
