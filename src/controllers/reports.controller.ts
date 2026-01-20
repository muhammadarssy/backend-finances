import { FastifyRequest, FastifyReply } from "fastify";
import {
  getMonthlyFinanceSummary,
  getBudgetUsageReport,
  getNetWorthReport,
  getInvestmentPerformanceReport,
} from "../services/reports.service.js";
import { sendSuccess } from "../utils/response.js";
import { z } from "zod";

const monthYearQuerySchema = z.object({
  month: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 12, { message: "Month must be between 1 and 12" }),
  year: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 2000 && val <= 2100, { message: "Year must be valid" }),
});

const dateRangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format"),
});

export async function getMonthlyFinanceSummaryHandler(
  request: FastifyRequest<{
    Querystring: {
      month: string;
      year: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  // Validate query params
  const { month, year } = monthYearQuerySchema.parse(request.query);

  const summary = await getMonthlyFinanceSummary(userId, month, year);

  return sendSuccess(reply, summary, "OK");
}

export async function getBudgetUsageReportHandler(
  request: FastifyRequest<{
    Querystring: {
      month: string;
      year: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  // Validate query params
  const { month, year } = monthYearQuerySchema.parse(request.query);

  const report = await getBudgetUsageReport(userId, month, year);

  return sendSuccess(reply, report, "OK");
}

export async function getNetWorthReportHandler(
  request: FastifyRequest<{
    Querystring: {
      from: string;
      to: string;
      interval?: "day" | "month";
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  // Validate query params
  const { from, to } = dateRangeQuerySchema.parse(request.query);
  const interval = request.query.interval || "month";

  if (interval !== "day" && interval !== "month") {
    return reply.status(400).send({
      success: false,
      message: "Interval must be 'day' or 'month'",
    });
  }

  const report = await getNetWorthReport(userId, from, to, interval);

  return sendSuccess(reply, report, "OK");
}

export async function getInvestmentPerformanceReportHandler(
  request: FastifyRequest<{
    Querystring: {
      from: string;
      to: string;
    };
  }>,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  // Validate query params
  const { from, to } = dateRangeQuerySchema.parse(request.query);

  const report = await getInvestmentPerformanceReport(userId, from, to);

  return sendSuccess(reply, report, "OK");
}
