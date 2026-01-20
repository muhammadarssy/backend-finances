import prisma from "../config/database.js";
import { stringify } from "csv-stringify/sync";
import { parseISO } from "date-fns";

export async function exportFinanceTransactionsToCSV(
  userId: string,
  from?: string,
  to?: string
) {
  const where: any = {
    userId,
    isDeleted: false,
  };

  if (from || to) {
    where.occurredAt = {};
    if (from) {
      where.occurredAt.gte = parseISO(from);
    }
    if (to) {
      where.occurredAt.lte = parseISO(to);
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
  });

  // Format data untuk CSV
  const csvData = transactions.map((tx) => ({
    Date: tx.occurredAt.toISOString().split("T")[0],
    Type: tx.type,
    Description: tx.description || "",
    Amount: tx.amount.toString(),
    Currency: tx.account?.currency || "IDR",
    Account: tx.account?.name || "",
    Category: tx.category?.name || "",
    Tags: tx.tags.map((tt) => tt.tag.name).join(", "),
    Notes: tx.notes || "",
  }));

  // Generate CSV
  const csv = stringify(csvData, {
    header: true,
    columns: ["Date", "Type", "Description", "Amount", "Currency", "Account", "Category", "Tags", "Notes"],
  });

  return csv;
}

export async function exportInvestmentTransactionsToCSV(
  userId: string,
  from?: string,
  to?: string
) {
  const where: any = {
    userId,
  };

  if (from || to) {
    where.occurredAt = {};
    if (from) {
      where.occurredAt.gte = parseISO(from);
    }
    if (to) {
      where.occurredAt.lte = parseISO(to);
    }
  }

  const transactions = await prisma.investmentTransaction.findMany({
    where,
    include: {
      asset: true,
      account: true,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });

  // Format data untuk CSV
  const csvData = transactions.map((tx) => ({
    Date: tx.occurredAt.toISOString().split("T")[0],
    Type: tx.type,
    Asset: tx.asset.name,
    AssetType: tx.asset.assetType,
    Units: tx.units?.toString() || "",
    PricePerUnit: tx.pricePerUnit?.toString() || "",
    NetAmount: tx.netAmount?.toString() || "",
    Fee: tx.fee?.toString() || "",
    Currency: tx.account?.currency || "IDR",
    Account: tx.account?.name || "",
    Notes: tx.notes || "",
  }));

  // Generate CSV
  const csv = stringify(csvData, {
    header: true,
    columns: [
      "Date",
      "Type",
      "Asset",
      "AssetType",
      "Units",
      "PricePerUnit",
      "NetAmount",
      "Fee",
      "Currency",
      "Account",
      "Notes",
    ],
  });

  return csv;
}
