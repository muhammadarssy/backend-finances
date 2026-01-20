import { FastifyInstance } from "fastify";
import {
  getMonthlyFinanceSummaryHandler,
  getBudgetUsageReportHandler,
  getNetWorthReportHandler,
  getInvestmentPerformanceReportHandler,
} from "../controllers/reports.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export default async function reportsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook("onRequest", requireAuth);

  // Monthly finance summary
  fastify.get(
    "/finance/monthly",
    {
      schema: {
        description: "Get monthly finance summary (income, expense, cashflow, by category)",
        tags: ["reports"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["month", "year"],
          properties: {
            month: {
              type: "string",
              description: "Month (1-12)",
            },
            year: {
              type: "string",
              description: "Year (e.g., 2026)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  income: { type: "string" },
                  expense: { type: "string" },
                  cashflow: { type: "string" },
                  byCategory: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        categoryId: { type: "string" },
                        categoryName: { type: "string" },
                        total: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    getMonthlyFinanceSummaryHandler
  );

  // Budget usage report
  fastify.get(
    "/budget/usage",
    {
      schema: {
        description: "Get budget usage report for a specific month",
        tags: ["reports"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["month", "year"],
          properties: {
            month: {
              type: "string",
              description: "Month (1-12)",
            },
            year: {
              type: "string",
              description: "Year (e.g., 2026)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  budget: { type: "object", nullable: true },
                  usage: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        categoryId: { type: "string" },
                        categoryName: { type: "string" },
                        budgeted: { type: "string" },
                        spent: { type: "string" },
                        remaining: { type: "string" },
                        percentage: { type: "string" },
                        isOverBudget: { type: "boolean" },
                      },
                    },
                  },
                  totalBudgeted: { type: "string" },
                  totalSpent: { type: "string" },
                  totalRemaining: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    getBudgetUsageReportHandler
  );

  // Net worth report
  fastify.get(
    "/networth",
    {
      schema: {
        description: "Get net worth report over time",
        tags: ["reports"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["from", "to"],
          properties: {
            from: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            to: {
              type: "string",
              description: "End date (YYYY-MM-DD)",
            },
            interval: {
              type: "string",
              enum: ["day", "month"],
              description: "Interval for timeline (default: month)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  interval: { type: "string" },
                  timeline: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        period: { type: "string" },
                        netWorth: { type: "string" },
                      },
                    },
                  },
                  current: {
                    type: "object",
                    properties: {
                      accountBalances: { type: "string" },
                      investmentValue: { type: "string" },
                      netWorth: { type: "string" },
                    },
                  },
                  note: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    getNetWorthReportHandler
  );

  // Investment performance report
  fastify.get(
    "/invest/performance",
    {
      schema: {
        description: "Get investment performance report",
        tags: ["reports"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["from", "to"],
          properties: {
            from: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            to: {
              type: "string",
              description: "End date (YYYY-MM-DD)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  period: {
                    type: "object",
                    properties: {
                      from: { type: "string" },
                      to: { type: "string" },
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalInvested: { type: "string" },
                      currentValue: { type: "string" },
                      unrealizedPL: { type: "string" },
                      realizedPL: { type: "string" },
                      totalReturn: { type: "string" },
                      roi: { type: "string" },
                    },
                  },
                  byAsset: {
                    type: "array",
                    items: { type: "object" },
                  },
                  byType: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        assetType: { type: "string" },
                        invested: { type: "string" },
                        percentage: { type: "string" },
                      },
                    },
                  },
                  note: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    getInvestmentPerformanceReportHandler
  );
}
