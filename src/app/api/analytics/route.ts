import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Analytics API
 * GET: Get financial analytics with real transaction data
 */

export async function GET(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const month = parseInt(
      searchParams.get("month") || new Date().getMonth() + 1 + ""
    );
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear() + ""
    );

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_user_email",
          message: "User email is required",
        },
        { status: 400 }
      );
    }

    console.log(`📊 Generating analytics for ${userEmail} - ${month}/${year}`);

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Get spending analysis for the month
    const spendingByCategory = await dbClient.getSpendingByCategory(
      user.id,
      month,
      year
    );

    // Get budget summary (if budgets exist)
    const budgetSummary = await dbClient.getBudgetSummary(user.id, month, year);

    // Calculate overall financial health
    const totalIncome = await calculateMonthlyIncome(
      dbClient,
      user.id,
      month,
      year
    );
    const totalExpenses = spendingByCategory.reduce(
      (sum, cat) => sum + cat.amount,
      0
    );
    const netAmount = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Calculate financial health score (0-100)
    let healthScore = 50; // Base score
    if (savingsRate > 20) healthScore += 20; // Good savings rate
    if (savingsRate > 10) healthScore += 10; // Decent savings rate
    if (netAmount > 0) healthScore += 15; // Positive cash flow
    if (totalExpenses < totalIncome * 0.8) healthScore += 10; // Living below means
    healthScore = Math.min(100, Math.max(0, healthScore));

    // Get health status
    let healthStatus = "Poor";
    let healthColor = "#EF4444";
    if (healthScore >= 80) {
      healthStatus = "Excellent";
      healthColor = "#10B981";
    } else if (healthScore >= 65) {
      healthStatus = "Good";
      healthColor = "#84CC16";
    } else if (healthScore >= 50) {
      healthStatus = "Fair";
      healthColor = "#F59E0B";
    }

    // Get past 6 months trends
    const monthlyTrends = await getMonthlyTrends(
      dbClient,
      user.id,
      month,
      year
    );

    return NextResponse.json({
      success: true,
      data: {
        currentMonth: { month, year },
        spendingByCategory: spendingByCategory.map((cat) => ({
          name: cat.category,
          amount: cat.amount,
          transactionCount: cat.transactionCount,
          color: getCategoryColor(cat.category),
        })),
        budgetSummary,
        financialHealth: {
          score: Math.round(healthScore),
          status: healthStatus,
          color: healthColor,
          metrics: {
            totalIncome,
            totalExpenses,
            netAmount,
            savingsRate: Math.round(savingsRate * 100) / 100,
          },
        },
        monthlyTrends,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to generate analytics:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "analytics_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}

/**
 * Calculate monthly income
 */
async function calculateMonthlyIncome(
  dbClient: DatabaseClient,
  userId: string,
  month: number,
  year: number
): Promise<number> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const startTimestamp = BigInt(startOfMonth.getTime());
  const endTimestamp = BigInt(endOfMonth.getTime());

  const incomeTransactions = await dbClient.prisma.transactions.findMany({
    where: {
      user_id: userId,
      date: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      amount: {
        gt: 0, // Only positive amounts (income)
      },
    },
    select: {
      amount: true,
    },
  });

  return incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
}

/**
 * Get monthly trends for the past 6 months
 */
async function getMonthlyTrends(
  dbClient: DatabaseClient,
  userId: string,
  currentMonth: number,
  currentYear: number
) {
  const trends = [];

  for (let i = 5; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    const income = await calculateMonthlyIncome(dbClient, userId, month, year);
    const spending = await dbClient.getSpendingByCategory(userId, month, year);
    const expenses = spending.reduce((sum, cat) => sum + cat.amount, 0);

    trends.push({
      month,
      year,
      monthName: new Date(year, month - 1).toLocaleDateString("en-US", {
        month: "short",
      }),
      income,
      expenses,
      net: income - expenses,
    });
  }

  return trends;
}

/**
 * Get category color
 */
function getCategoryColor(categoryName: string): string {
  const colorMap: Record<string, string> = {
    "Food & Dining": "#EF4444",
    Transportation: "#F59E0B",
    Shopping: "#8B5CF6",
    "Bills & Utilities": "#3B82F6",
    Entertainment: "#F97316",
    Healthcare: "#06B6D4",
    Education: "#84CC16",
    Travel: "#EC4899",
    "Personal Care": "#A855F7",
    "Other Expenses": "#6B7280",
  };

  return colorMap[categoryName] || "#6B7280";
}
