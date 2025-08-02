import { PrismaClient } from "@prisma/client";
import type { Account, Transaction } from "@/types/sparebank1";

/**
 * DatabaseClient - ONLY handles database operations with Prisma
 * No API logic, no external calls, no business logic
 * Pure database operations that match the SpareBank1 data exactly
 */
export class DatabaseClient {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get or create a user by email
   */
  async getOrCreateUser(email: string, name?: string) {
    try {
      let user = await this.prisma.users.findFirst({
        where: { email },
      });

      if (!user) {
        console.log("👤 Creating new user:", email);
        user = await this.prisma.users.create({
          data: {
            email,
            name,
            id: "sparebank1-user",
            updated_at: new Date(),
          },
        });
      }

      return user;
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get/create user:", error);
      throw new Error(`Failed to get/create user: ${error}`);
    }
  }

  /**
   * Save accounts to database
   * Takes SpareBank1 Account objects and saves them exactly as-is
   */
  async saveAccounts(userId: string, accounts: Account[]): Promise<void> {
    try {
      console.log(
        `💾 DatabaseClient: Saving ${accounts.length} accounts for user ${userId}`
      );

      for (const account of accounts) {
        await this.prisma.accounts.upsert({
          where: { key: account.key },
          update: {
            // Update all fields exactly as SpareBank1 provides them (NO mapping!)
            accountNumber: account.accountNumber,
            iban: account.iban,
            name: account.name,
            description: account.description,
            balance: account.balance,
            availableBalance: account.availableBalance,
            currencyCode: account.currencyCode,
            type: account.type,
            productType: account.productType,
            productId: account.productId,
            descriptionCode: account.descriptionCode,
            disposalRole: account.disposalRole,
            owner: account.owner, // Store as JSON exactly as received
            accountProperties: account.accountProperties, // Store as JSON exactly as received
            synced_at: new Date(),
            updated_at: new Date(),
          },
          create: {
            user_id: userId,
            // Create with all fields exactly as SpareBank1 provides them (NO mapping!)
            key: account.key,
            accountNumber: account.accountNumber,
            iban: account.iban,
            name: account.name,
            description: account.description,
            balance: account.balance,
            availableBalance: account.availableBalance,
            currencyCode: account.currencyCode,
            type: account.type,
            productType: account.productType,
            productId: account.productId,
            descriptionCode: account.descriptionCode,
            disposalRole: account.disposalRole,
            owner: account.owner, // Store as JSON exactly as received
            accountProperties: account.accountProperties, // Store as JSON exactly as received
            synced_at: new Date(),
          },
        });
      }

      console.log(
        `✅ DatabaseClient: Successfully saved ${accounts.length} accounts`
      );
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to save accounts:", error);
      throw new Error(`Failed to save accounts: ${error}`);
    }
  }

  /**
   * Save transactions to database
   * Takes SpareBank1 Transaction objects and saves them exactly as-is
   */
  async saveTransactions(
    userId: string,
    transactions: Transaction[]
  ): Promise<{ saved: number; skipped: number }> {
    try {
      console.log(
        `💾 DatabaseClient: Processing ${transactions.length} transactions for user ${userId}`
      );

      let saved = 0;
      let skipped = 0;

      for (const transaction of transactions) {
        // Check for duplicates using amount + date + description (more reliable than sparebank1_id)
        const existing = await this.prisma.transactions.findFirst({
          where: {
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.description,
            user_id: userId,
          },
        });

        if (existing) {
          console.log(
            `⚠️ Duplicate found: ${transaction.description} (${
              transaction.amount
            }) on ${new Date(Number(transaction.date)).toISOString()}`
          );
          skipped++;
          continue;
        }

        // Get the account for this transaction
        const account = await this.prisma.accounts.findUnique({
          where: { key: transaction.accountKey },
        });

        if (!account) {
          console.warn(
            `⚠️ Account not found for transaction ${transaction.id}, accountKey: ${transaction.accountKey}`
          );
          skipped++;
          continue;
        }

        // Save transaction exactly as SpareBank1 provides it
        await this.prisma.transactions.create({
          data: {
            user_id: userId,
            account_id: account.id,
            // SpareBank1 fields exactly as provided
            sparebank1_id: transaction.id,
            non_unique_id: transaction.nonUniqueId,
            description: transaction.description,
            cleaned_description: transaction.cleanedDescription,
            remote_account_number: transaction.remoteAccountNumber,
            remote_account_name: transaction.remoteAccountName,
            amount: transaction.amount,
            date: transaction.date, // Unix timestamp as BigInt
            type_code: transaction.typeCode,
            currency_code: transaction.currencyCode,
            can_show_details: transaction.canShowDetails,
            source: transaction.source,
            is_confidential: transaction.isConfidential,
            booking_status: transaction.bookingStatus,
            account_name: transaction.accountName,
            account_key: transaction.accountKey,
            account_currency: transaction.accountCurrency,
            is_from_currency_account: transaction.isFromCurrencyAccount,
            kid_or_message: transaction.kidOrMessage,
            // JSON fields stored as-is
            account_number: transaction.accountNumber,
            classification_input: transaction.classificationInput,
            merchant: transaction.merchant,
            synced_at: new Date(),
          },
        });

        saved++;
      }

      console.log(
        `✅ DatabaseClient: Saved ${saved} transactions, skipped ${skipped} duplicates`
      );
      return { saved, skipped };
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to save transactions:", error);
      throw new Error(`Failed to save transactions: ${error}`);
    }
  }

  /**
   * Find and remove duplicate transactions
   * Duplicates are identified by: amount + date + description + user_id
   * Keeps the oldest transaction (by created_at)
   */
  async findAndRemoveDuplicates(userId: string): Promise<{
    duplicatesFound: number;
    duplicatesRemoved: number;
    duplicateGroups: Array<{
      amount: number;
      date: bigint;
      description: string;
      count: number;
      kept: string;
      removed: string[];
    }>;
  }> {
    try {
      console.log("🔍 Starting duplicate cleanup for user:", userId);

      // Find all transactions grouped by amount + date + description
      const duplicateGroups = await this.prisma.transactions.groupBy({
        by: ["amount", "date", "description"],
        where: { user_id: userId },
        having: {
          id: {
            _count: {
              gt: 1,
            },
          },
        },
        _count: {
          id: true,
        },
      });

      console.log(`📊 Found ${duplicateGroups.length} duplicate groups`);

      let totalDuplicatesFound = 0;
      let totalDuplicatesRemoved = 0;
      const results = [];

      for (const group of duplicateGroups) {
        // Get all transactions in this duplicate group
        const transactions = await this.prisma.transactions.findMany({
          where: {
            user_id: userId,
            amount: group.amount,
            date: group.date,
            description: group.description,
          },
          orderBy: { created_at: "asc" }, // Keep the oldest one
        });

        if (transactions.length > 1) {
          totalDuplicatesFound += transactions.length;

          // Keep the first (oldest) transaction, remove the rest
          const [keep, ...remove] = transactions;
          const removedIds = [];

          for (const transaction of remove) {
            await this.prisma.transactions.delete({
              where: { id: transaction.id },
            });
            removedIds.push(transaction.id);
            totalDuplicatesRemoved++;
          }

          results.push({
            amount: parseFloat(group.amount.toString()),
            date: group.date,
            description: group.description || "No description",
            count: transactions.length,
            kept: keep.id,
            removed: removedIds,
          });

          console.log(
            `🧹 Cleaned duplicates: "${group.description}" (${group.amount}) - kept 1, removed ${removedIds.length}`
          );
        }
      }

      console.log(
        `✅ Duplicate cleanup complete: Found ${totalDuplicatesFound} duplicates in ${duplicateGroups.length} groups, removed ${totalDuplicatesRemoved}`
      );

      return {
        duplicatesFound: totalDuplicatesFound,
        duplicatesRemoved: totalDuplicatesRemoved,
        duplicateGroups: results,
      };
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to cleanup duplicates:", error);
      throw new Error(`Failed to cleanup duplicates: ${error}`);
    }
  }

  /**
   * Get accounts from database
   */
  async getAccounts(userId: string) {
    try {
      return await this.prisma.accounts.findMany({
        where: { user_id: userId },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get accounts:", error);
      throw new Error(`Failed to get accounts: ${error}`);
    }
  }

  /**
   * Get transactions from database with pagination and filters
   */
  async getTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      accountId?: string;
      search?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { user_id: userId };

      if (options?.accountId) {
        where.account_id = options.accountId;
      }

      if (options?.search) {
        where.description = {
          contains: options.search,
          mode: "insensitive",
        };
      }

      if (options?.fromDate || options?.toDate) {
        where.date = {};
        if (options.fromDate) {
          where.date.gte = BigInt(options.fromDate.getTime());
        }
        if (options.toDate) {
          where.date.lte = BigInt(options.toDate.getTime());
        }
      }

      // Get transactions with account data
      const [transactions, total] = await Promise.all([
        this.prisma.transactions.findMany({
          where,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                accountNumber: true,
                type: true,
              },
            },
          },
          orderBy: { date: "desc" },
          skip,
          take: limit,
        }),
        this.prisma.transactions.count({ where }),
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      };
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get transactions:", error);
      throw new Error(`Failed to get transactions: ${error}`);
    }
  }

  /**
   * Check if accounts were synced today
   */
  async accountsSyncedToday(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recentSync = await this.prisma.accounts.findFirst({
        where: {
          user_id: userId,
          synced_at: {
            gte: today,
          },
        },
      });

      return !!recentSync;
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to check sync status:", error);
      return false;
    }
  }

  /**
   * BUDGET MANAGEMENT FUNCTIONS
   */

  /**
   * Initialize default budget categories
   */
  async initializeBudgetCategories() {
    const defaultCategories = [
      // Expense categories
      { name: "Food & Dining", icon: "🍽️", color: "#EF4444", is_income: false },
      {
        name: "Transportation",
        icon: "🚗",
        color: "#F59E0B",
        is_income: false,
      },
      { name: "Shopping", icon: "🛒", color: "#8B5CF6", is_income: false },
      {
        name: "Bills & Utilities",
        icon: "⚡",
        color: "#3B82F6",
        is_income: false,
      },
      { name: "Entertainment", icon: "🎬", color: "#F97316", is_income: false },
      { name: "Healthcare", icon: "🏥", color: "#06B6D4", is_income: false },
      { name: "Education", icon: "📚", color: "#84CC16", is_income: false },
      { name: "Travel", icon: "✈️", color: "#EC4899", is_income: false },
      { name: "Personal Care", icon: "💄", color: "#A855F7", is_income: false },
      {
        name: "Other Expenses",
        icon: "📋",
        color: "#6B7280",
        is_income: false,
      },

      // Income categories
      { name: "Salary", icon: "💰", color: "#10B981", is_income: true },
      { name: "Freelance", icon: "💻", color: "#059669", is_income: true },
      { name: "Investments", icon: "📈", color: "#047857", is_income: true },
      { name: "Other Income", icon: "💎", color: "#065F46", is_income: true },
    ];

    for (const category of defaultCategories) {
      await this.prisma.budget_categories.upsert({
        where: { name: category.name },
        update: category,
        create: category,
      });
    }

    console.log("✅ Budget categories initialized");
  }

  /**
   * Get all budget categories
   */
  async getBudgetCategories(includeIncome = true) {
    return await this.prisma.budget_categories.findMany({
      where: includeIncome ? {} : { is_income: false },
      orderBy: [{ is_income: "desc" }, { name: "asc" }],
    });
  }

  /**
   * Create or update a monthly budget
   */
  async createOrUpdateBudget(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
    budgetedAmount: number
  ) {
    try {
      return await this.prisma.budgets.upsert({
        where: {
          user_id_category_id_month_year: {
            user_id: userId,
            category_id: categoryId,
            month,
            year,
          },
        },
        update: {
          budgeted_amount: budgetedAmount,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          category_id: categoryId,
          month,
          year,
          budgeted_amount: budgetedAmount,
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      console.error(
        "❌ DatabaseClient: Failed to create/update budget:",
        error
      );
      throw new Error(`Failed to create/update budget: ${error}`);
    }
  }

  /**
   * Get user's budgets for a specific month
   */
  async getUserBudgets(userId: string, month: number, year: number) {
    try {
      return await this.prisma.budgets.findMany({
        where: {
          user_id: userId,
          month,
          year,
          is_active: true,
        },
        include: {
          category: true,
        },
        orderBy: {
          category: {
            name: "asc",
          },
        },
      });
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get user budgets:", error);
      throw new Error(`Failed to get user budgets: ${error}`);
    }
  }

  /**
   * Analyze spending by category for budget tracking
   */
  async getSpendingByCategory(userId: string, month: number, year: number) {
    try {
      // Get start and end of month as timestamps
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      const startTimestamp = BigInt(startOfMonth.getTime());
      const endTimestamp = BigInt(endOfMonth.getTime());

      // Get all transactions for the month
      const transactions = await this.prisma.transactions.findMany({
        where: {
          user_id: userId,
          date: {
            gte: startTimestamp,
            lte: endTimestamp,
          },
        },
        select: {
          amount: true,
          description: true,
          date: true,
        },
      });

      // Categorize transactions (simple keyword matching for now)
      const categorySpending = new Map<
        string,
        { amount: number; count: number; transactions: any[] }
      >();

      // Initialize with categories
      const categories = await this.getBudgetCategories(false); // Only expense categories
      for (const category of categories) {
        categorySpending.set(category.name, {
          amount: 0,
          count: 0,
          transactions: [],
        });
      }

      // Categorize transactions
      for (const transaction of transactions) {
        if (transaction.amount >= 0) continue; // Skip income

        const amount = Math.abs(Number(transaction.amount));
        const description = (transaction.description || "").toLowerCase();
        let categorized = false;

        // Simple keyword matching
        const categoryMappings = {
          "Food & Dining": [
            "restaurant",
            "cafe",
            "pizza",
            "burger",
            "food",
            "dining",
            "kitchen",
            "menu",
            "delivery",
            "takeaway",
          ],
          Transportation: [
            "taxi",
            "uber",
            "lyft",
            "bus",
            "train",
            "parking",
            "gas",
            "fuel",
            "transport",
          ],
          Shopping: [
            "store",
            "shop",
            "mall",
            "market",
            "amazon",
            "online",
            "purchase",
            "retail",
          ],
          "Bills & Utilities": [
            "electric",
            "water",
            "internet",
            "phone",
            "utility",
            "bill",
            "insurance",
            "rent",
          ],
          Entertainment: [
            "movie",
            "cinema",
            "game",
            "music",
            "spotify",
            "netflix",
            "entertainment",
            "party",
          ],
          Healthcare: [
            "hospital",
            "doctor",
            "pharmacy",
            "medical",
            "health",
            "clinic",
            "medicine",
          ],
          Education: [
            "school",
            "university",
            "course",
            "education",
            "book",
            "tuition",
            "study",
          ],
          Travel: [
            "hotel",
            "flight",
            "travel",
            "trip",
            "vacation",
            "booking",
            "airbnb",
          ],
          "Personal Care": [
            "salon",
            "spa",
            "beauty",
            "cosmetic",
            "personal",
            "hygiene",
            "care",
          ],
        };

        for (const [categoryName, keywords] of Object.entries(
          categoryMappings
        )) {
          if (keywords.some((keyword) => description.includes(keyword))) {
            const existing = categorySpending.get(categoryName);
            if (existing) {
              existing.amount += amount;
              existing.count += 1;
              existing.transactions.push(transaction);
              categorized = true;
              break;
            }
          }
        }

        // If not categorized, add to "Other Expenses"
        if (!categorized) {
          const other = categorySpending.get("Other Expenses");
          if (other) {
            other.amount += amount;
            other.count += 1;
            other.transactions.push(transaction);
          }
        }
      }

      return Array.from(categorySpending.entries()).map(([name, data]) => ({
        category: name,
        amount: data.amount,
        transactionCount: data.count,
        transactions: data.transactions,
      }));
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to analyze spending:", error);
      throw new Error(`Failed to analyze spending: ${error}`);
    }
  }

  /**
   * Get budget summary with spending analysis
   */
  async getBudgetSummary(userId: string, month: number, year: number) {
    try {
      const budgets = await this.getUserBudgets(userId, month, year);
      const spending = await this.getSpendingByCategory(userId, month, year);

      return budgets.map((budget) => {
        const spendingData = spending.find(
          (s) => s.category === budget.category.name
        );
        const actualSpent = spendingData?.amount || 0;
        const budgetedAmount = Number(budget.budgeted_amount);
        const percentageUsed =
          budgetedAmount > 0 ? (actualSpent / budgetedAmount) * 100 : 0;
        const remaining = budgetedAmount - actualSpent;

        return {
          id: budget.id,
          category: budget.category,
          budgetedAmount,
          actualSpent,
          remaining,
          percentageUsed,
          isOverBudget: actualSpent > budgetedAmount,
          transactionCount: spendingData?.transactionCount || 0,
          alertPercentage: budget.alert_percentage,
          shouldAlert: percentageUsed >= budget.alert_percentage,
        };
      });
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get budget summary:", error);
      throw new Error(`Failed to get budget summary: ${error}`);
    }
  }

  /**
   * Get comprehensive August budget analysis
   */
  async getAugustBudgetAnalysis(userId: string, year: number = 2025) {
    try {
      const month = 8; // August
      const now = new Date();
      const daysInMonth = new Date(year, month, 0).getDate(); // 31 days in August
      const currentDay = now.getMonth() === month - 1 && now.getFullYear() === year 
        ? now.getDate() 
        : (now > new Date(year, month - 1) ? daysInMonth : 1);
      const daysRemaining = Math.max(0, daysInMonth - currentDay);
      const daysElapsed = currentDay;

      // Get budget data
      const budgets = await this.getUserBudgets(userId, month, year);
      const spending = await this.getSpendingByCategory(userId, month, year);
      const monthlyGoal = await this.getMonthlyBudgetGoal(userId, month, year);

      // Calculate totals
      const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
      const totalSpent = spending.reduce((sum, s) => sum + s.amount, 0);
      const totalRemaining = totalBudgeted - totalSpent;

      // Calculate daily averages and projections
      const dailyBudget = totalBudgeted / daysInMonth;
      const dailySpentAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
      const projectedTotalSpending = dailySpentAverage * daysInMonth;
      const projectedOverBudget = projectedTotalSpending - totalBudgeted;

      // Get transaction details for August
      const augustTransactions = await this.getAugustTransactions(userId, year);

      // Category analysis with projections
      const categoryAnalysis = budgets.map((budget) => {
        const spendingData = spending.find(s => s.category === budget.category.name);
        const actualSpent = spendingData?.amount || 0;
        const budgetedAmount = Number(budget.budgeted_amount);
        const percentageUsed = budgetedAmount > 0 ? (actualSpent / budgetedAmount) * 100 : 0;
        
        // Calculate category projection
        const categoryDailySpent = daysElapsed > 0 ? actualSpent / daysElapsed : 0;
        const categoryProjectedSpending = categoryDailySpent * daysInMonth;
        const categoryProjectedOverBudget = categoryProjectedSpending - budgetedAmount;

        return {
          id: budget.id,
          category: budget.category,
          budgetedAmount,
          actualSpent,
          remaining: budgetedAmount - actualSpent,
          percentageUsed,
          isOverBudget: actualSpent > budgetedAmount,
          transactionCount: spendingData?.transactionCount || 0,
          alertPercentage: budget.alert_percentage,
          shouldAlert: percentageUsed >= budget.alert_percentage,
          // New projection fields
          dailySpentAverage: categoryDailySpent,
          projectedTotalSpending: categoryProjectedSpending,
          projectedOverBudget: categoryProjectedOverBudget,
          isProjectedOverBudget: categoryProjectedSpending > budgetedAmount,
        };
      });

      return {
        month: "August",
        year,
        period: {
          daysInMonth,
          daysElapsed,
          daysRemaining,
          percentageComplete: (daysElapsed / daysInMonth) * 100,
        },
        monthlyGoal: monthlyGoal ? {
          totalBudget: Number(monthlyGoal.total_budget),
          notes: monthlyGoal.notes,
          isSet: true,
          difference: Number(monthlyGoal.total_budget) - totalBudgeted,
          goalPercentageUsed: Number(monthlyGoal.total_budget) > 0 ? (totalSpent / Number(monthlyGoal.total_budget)) * 100 : 0,
        } : {
          isSet: false,
          totalBudget: 0,
          notes: null,
          difference: 0,
          goalPercentageUsed: 0,
        },
        totals: {
          budgeted: totalBudgeted,
          spent: totalSpent,
          remaining: totalRemaining,
          percentageUsed: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
        },
        projections: {
          dailyBudget,
          dailySpentAverage,
          projectedTotalSpending,
          projectedOverBudget,
          isProjectedOverBudget: projectedOverBudget > 0,
        },
        categories: categoryAnalysis,
        transactions: {
          total: augustTransactions.total,
          thisMonth: augustTransactions.transactions.length,
        },
        alerts: {
          overBudgetCount: categoryAnalysis.filter(c => c.isOverBudget).length,
          projectedOverBudgetCount: categoryAnalysis.filter(c => c.isProjectedOverBudget).length,
          alertCount: categoryAnalysis.filter(c => c.shouldAlert).length,
        }
      };
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get August budget analysis:", error);
      throw new Error(`Failed to get August budget analysis: ${error}`);
    }
  }

  /**
   * Get all August transactions with details
   */
  async getAugustTransactions(userId: string, year: number = 2025) {
    try {
      const month = 8; // August
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      const startTimestamp = BigInt(startOfMonth.getTime());
      const endTimestamp = BigInt(endOfMonth.getTime());

      const transactions = await this.prisma.transactions.findMany({
        where: {
          user_id: userId,
          date: {
            gte: startTimestamp,
            lte: endTimestamp,
          },
        },
        include: {
          account: true,
        },
        orderBy: { date: 'desc' },
      });

      const total = await this.prisma.transactions.count({
        where: {
          user_id: userId,
          date: {
            gte: startTimestamp,
            lte: endTimestamp,
          },
        },
      });

      return {
        transactions,
        total,
        period: {
          start: startOfMonth,
          end: endOfMonth,
          month: "August",
          year,
        }
      };
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get August transactions:", error);
      throw new Error(`Failed to get August transactions: ${error}`);
    }
  }

  /**
   * Create or update monthly budget goal
   */
  async setMonthlyBudgetGoal(userId: string, month: number, year: number, totalBudget: number, notes?: string) {
    try {
      return await this.prisma.monthly_budget_goals.upsert({
        where: {
          user_id_month_year: {
            user_id: userId,
            month,
            year,
          },
        },
        update: {
          total_budget: totalBudget,
          notes: notes || null,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          month,
          year,
          total_budget: totalBudget,
          notes: notes || null,
        },
      });
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to set monthly budget goal:", error);
      throw new Error(`Failed to set monthly budget goal: ${error}`);
    }
  }

  /**
   * Get monthly budget goal
   */
  async getMonthlyBudgetGoal(userId: string, month: number, year: number) {
    try {
      return await this.prisma.monthly_budget_goals.findUnique({
        where: {
          user_id_month_year: {
            user_id: userId,
            month,
            year,
          },
        },
      });
    } catch (error) {
      console.error("❌ DatabaseClient: Failed to get monthly budget goal:", error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}
