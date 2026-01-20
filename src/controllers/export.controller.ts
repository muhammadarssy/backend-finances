import { FastifyRequest, FastifyReply } from "fastify";
import {
  exportFinanceTransactionsToCSV,
  exportInvestmentTransactionsToCSV,
} from "../services/export.service.js";
import { z } from "zod";

const dateRangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format").optional(),
});

export async function exportFinanceTransactionsHandler(
  request: FastifyRequest<{
    Querystring: {
      from?: string;
      to?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  // Validate query params
  const { from, to } = dateRangeQuerySchema.parse(request.query);

  const csv = await exportFinanceTransactionsToCSV(userId, from, to);

  reply.header("Content-Type", "text/csv");
  reply.header("Content-Disposition", `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`);

  return reply.send(csv);
}

export async function exportInvestmentTransactionsHandler(
  request: FastifyRequest<{
    Querystring: {
      from?: string;
      to?: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  // Validate query params
  const { from, to } = dateRangeQuerySchema.parse(request.query);

  const csv = await exportInvestmentTransactionsToCSV(userId, from, to);

  reply.header("Content-Type", "text/csv");
  reply.header("Content-Disposition", `attachment; filename="investment-transactions-${new Date().toISOString().split("T")[0]}.csv"`);

  return reply.send(csv);
}
