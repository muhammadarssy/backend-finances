import { FastifyRequest, FastifyReply } from "fastify";
import {
  listWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../services/watchlist.service.js";
import { sendSuccess } from "../utils/response.js";
import { addToWatchlistSchema } from "../validators/watchlist.js";

export async function listWatchlistHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const watchlist = await listWatchlist(userId);

  return sendSuccess(reply, watchlist, "OK");
}

export async function addToWatchlistHandler(
  request: FastifyRequest<{
    Body: {
      assetId: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { assetId } = request.body;

  // Validate input
  addToWatchlistSchema.parse({ assetId });

  const watchlist = await addToWatchlist(assetId, userId);

  return sendSuccess(reply, watchlist, "Asset added to watchlist", 201);
}

export async function removeFromWatchlistHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const { id } = request.params;

  await removeFromWatchlist(id, userId);

  return sendSuccess(reply, null, "Asset removed from watchlist");
}
