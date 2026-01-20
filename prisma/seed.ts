import { PrismaClient, AccountType, CategoryType, TransactionType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.debtPayment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.investmentTransaction.deleteMany();
  await prisma.investmentAsset.deleteMany();
  await prisma.recurringRun.deleteMany();
  await prisma.recurringRule.deleteMany();
  await prisma.billPayment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transactionTag.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const passwordHash = await bcrypt.hash("password123", 10);

  // Create sample user
  console.log("👤 Creating sample user...");
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
      passwordHash,
      defaultCurrency: "IDR",
      timezone: "Asia/Jakarta",
    },
  });

  // Create sample accounts
  console.log("💰 Creating sample accounts...");
  const bcaAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "BCA",
      type: AccountType.BANK,
      currency: "IDR",
      startingBalance: 5000000,
      currentBalance: 3500000,
      isArchived: false,
    },
  });

  const cashAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Cash",
      type: AccountType.CASH,
      currency: "IDR",
      startingBalance: 500000,
      currentBalance: 300000,
      isArchived: false,
    },
  });

  const gopayAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "GoPay",
      type: AccountType.EWALLET,
      currency: "IDR",
      startingBalance: 200000,
      currentBalance: 150000,
      isArchived: false,
    },
  });

  // Create sample categories
  console.log("📁 Creating sample categories...");
  
  // Income categories
  const salaryCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Salary",
      type: CategoryType.INCOME,
      icon: "💼",
      color: "#10B981",
      isArchived: false,
    },
  });

  const bonusCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Bonus",
      type: CategoryType.INCOME,
      icon: "🎁",
      color: "#3B82F6",
      isArchived: false,
    },
  });

  // Expense categories
  const foodParentCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Food & Drinks",
      type: CategoryType.EXPENSE,
      icon: "🍔",
      color: "#EF4444",
      isArchived: false,
    },
  });

  const foodCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Restaurant",
      type: CategoryType.EXPENSE,
      icon: "🍽️",
      color: "#F59E0B",
      parentId: foodParentCategory.id,
      isArchived: false,
    },
  });

  const transportCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Transportation",
      type: CategoryType.EXPENSE,
      icon: "🚗",
      color: "#6366F1",
      isArchived: false,
    },
  });

  const billsCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Bills",
      type: CategoryType.EXPENSE,
      icon: "📄",
      color: "#8B5CF6",
      isArchived: false,
    },
  });

  const entertainmentCategory = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Entertainment",
      type: CategoryType.EXPENSE,
      icon: "🎬",
      color: "#EC4899",
      isArchived: false,
    },
  });

  // Create sample tags
  console.log("🏷️ Creating sample tags...");
  const workTag = await prisma.tag.create({
    data: {
      userId: user.id,
      name: "work",
    },
  });

  const personalTag = await prisma.tag.create({
    data: {
      userId: user.id,
      name: "personal",
    },
  });

  const urgentTag = await prisma.tag.create({
    data: {
      userId: user.id,
      name: "urgent",
    },
  });

  // Create sample transactions
  console.log("💸 Creating sample transactions...");
  
  // Income transaction
  const incomeTransaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.INCOME,
      amount: 10000000,
      currency: "IDR",
      occurredAt: new Date("2026-01-01T08:00:00Z"),
      note: "Monthly salary",
      accountId: bcaAccount.id,
      categoryId: salaryCategory.id,
      isDeleted: false,
      tags: {
        create: [{ tagId: workTag.id }],
      },
    },
  });

  // Expense transactions
  const foodTransaction1 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: 75000,
      currency: "IDR",
      occurredAt: new Date("2026-01-05T12:00:00Z"),
      note: "Lunch at restaurant",
      accountId: cashAccount.id,
      categoryId: foodCategory.id,
      isDeleted: false,
      tags: {
        create: [{ tagId: personalTag.id }],
      },
    },
  });

  const foodTransaction2 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: 50000,
      currency: "IDR",
      occurredAt: new Date("2026-01-10T12:30:00Z"),
      note: "Coffee break",
      accountId: gopayAccount.id,
      categoryId: foodCategory.id,
      isDeleted: false,
      tags: {
        create: [{ tagId: workTag.id }],
      },
    },
  });

  const transportTransaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: 25000,
      currency: "IDR",
      occurredAt: new Date("2026-01-15T09:00:00Z"),
      note: "Grab ride to office",
      accountId: gopayAccount.id,
      categoryId: transportCategory.id,
      isDeleted: false,
      tags: {
        create: [{ tagId: workTag.id }],
      },
    },
  });

  // Transfer transaction
  const transferTransaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.TRANSFER,
      amount: 500000,
      currency: "IDR",
      occurredAt: new Date("2026-01-20T10:00:00Z"),
      note: "Top up GoPay",
      fromAccountId: bcaAccount.id,
      toAccountId: gopayAccount.id,
      isDeleted: false,
    },
  });

  // Create sample bill
  console.log("📄 Creating sample bills...");
  const internetBill = await prisma.bill.create({
    data: {
      userId: user.id,
      name: "Internet",
      amount: 350000,
      currency: "IDR",
      categoryId: billsCategory.id,
      accountId: bcaAccount.id,
      dueDate: new Date("2026-01-25T00:00:00Z"),
      status: "UNPAID",
      reminderDays: [7, 3, 1],
    },
  });

  // Create sample budget
  console.log("📊 Creating sample budget...");
  const currentDate = new Date();
  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      totalLimit: 3000000,
      items: {
        create: [
          {
            categoryId: foodCategory.id,
            limitAmount: 1000000,
          },
          {
            categoryId: transportCategory.id,
            limitAmount: 500000,
          },
          {
            categoryId: entertainmentCategory.id,
            limitAmount: 500000,
          },
        ],
      },
    },
  });

  // Create sample investment asset
  console.log("📈 Creating sample investment assets...");
  const stockAsset = await prisma.investmentAsset.create({
    data: {
      userId: user.id,
      symbol: "BBCA",
      name: "Bank Central Asia",
      assetType: "STOCK",
      exchange: "IDX",
      currency: "IDR",
    },
  });

  const cryptoAsset = await prisma.investmentAsset.create({
    data: {
      userId: user.id,
      symbol: "BTC",
      name: "Bitcoin",
      assetType: "CRYPTO",
      currency: "USD",
    },
  });

  // Create sample investment transaction
  console.log("💹 Creating sample investment transactions...");
  await prisma.investmentTransaction.create({
    data: {
      userId: user.id,
      assetId: stockAsset.id,
      type: "BUY",
      units: 10,
      pricePerUnit: 9000,
      grossAmount: 90000,
      feeAmount: 500,
      taxAmount: 0,
      netAmount: 90500,
      occurredAt: new Date("2026-01-18T10:00:00Z"),
      note: "First buy",
      cashAccountId: bcaAccount.id,
    },
  });

  // Create sample holding
  console.log("📦 Creating sample holdings...");
  await prisma.holding.create({
    data: {
      userId: user.id,
      assetId: stockAsset.id,
      unitsTotal: 10,
      avgBuyPrice: 9050,
    },
  });

  // Create sample watchlist
  console.log("👀 Creating sample watchlist...");
  await prisma.watchlist.create({
    data: {
      userId: user.id,
      assetId: cryptoAsset.id,
    },
  });

  // Create sample price alert
  console.log("🔔 Creating sample price alerts...");
  await prisma.priceAlert.create({
    data: {
      userId: user.id,
      assetId: stockAsset.id,
      condition: "ABOVE",
      targetPrice: 10000,
      isActive: true,
    },
  });

  console.log("✅ Database seeding completed!");
  console.log("\n📝 Sample data summary:");
  console.log(`   - User: ${user.email} (password: password123)`);
  console.log(`   - Accounts: 3 (BCA, Cash, GoPay)`);
  console.log(`   - Categories: 7 (1 parent, 6 children)`);
  console.log(`   - Tags: 3`);
  console.log(`   - Transactions: 5 (1 income, 3 expense, 1 transfer)`);
  console.log(`   - Bills: 1 (unpaid)`);
  console.log(`   - Budget: 1 (current month)`);
  console.log(`   - Investment Assets: 2`);
  console.log(`   - Investment Transactions: 1`);
  console.log(`   - Holdings: 1`);
  console.log(`   - Watchlist: 1`);
  console.log(`   - Price Alerts: 1`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
