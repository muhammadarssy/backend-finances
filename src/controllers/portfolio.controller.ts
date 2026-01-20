import { FastifyRequest, FastifyReply } from "fastify";
import {
  getPortfolioSummary,
  listHoldings,
  getHoldingByAssetId,
  rebuildHoldings,
} from "../services/portfolio.service.js";
import { sendSuccess } from "../utils/response.js";
import { InvestmentAssetType } from "@prisma/client";

export async function getPortfolioSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const summary = await getPortfolioSummary(userId);

  return sendSuccess(reply, summary, "OK");
}

export async function listHoldingsHandler(
  request: FastifyRequest<{
    Querystring: {
      assetType?: InvestmentAssetType;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const filters = {
    assetType: request.query.assetType,
  };

  const holdings = await listHoldings(userId, filters);

  return sendSuccess(reply, holdings, "OK");
}

export async function getHoldingHandler(
  request: FastifyRequest<{
    Params: {
      assetId: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { assetId } = request.params;

  const holding = await getHoldingByAssetId(assetId, userId);

  return sendSuccess(reply, holding, "OK");
}

export async function rebuildHoldingsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const result = await rebuildHoldings(userId);

  return sendSuccess(reply, result, "Holdings rebuilt successfully");
}
