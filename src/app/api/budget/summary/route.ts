import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Budget Summary API
 * GET: Get budget summary with spending analysis
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

    console.log(
      `📊 Getting budget summary for ${userEmail} - ${month}/${year}`
    );

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Get budget summary
    const budgetSummary = await dbClient.getBudgetSummary(user.id, month, year);

    // Calculate totals
    const totalBudgeted = budgetSummary.reduce(
      (sum, item) => sum + item.budgetedAmount,
      0
    );
    const totalSpent = budgetSummary.reduce(
      (sum, item) => sum + item.actualSpent,
      0
    );
    const totalRemaining = totalBudgeted - totalSpent;
    const overallPercentage =
      totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    // Count categories with alerts
    const alertCount = budgetSummary.filter((item) => item.shouldAlert).length;
    const overBudgetCount = budgetSummary.filter(
      (item) => item.isOverBudget
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        summary: budgetSummary,
        totals: {
          budgeted: totalBudgeted,
          spent: totalSpent,
          remaining: totalRemaining,
          percentageUsed: Math.round(overallPercentage * 100) / 100,
        },
        alerts: {
          alertCount,
          overBudgetCount,
          hasAlerts: alertCount > 0 || overBudgetCount > 0,
        },
        period: { month, year },
      },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to get budget summary:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "summary_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}
