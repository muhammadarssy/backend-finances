import { z } from "zod";

export const addToWatchlistSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
});

export const removeFromWatchlistSchema = z.object({
  id: z.string().min(1, "Watchlist ID is required"),
});
