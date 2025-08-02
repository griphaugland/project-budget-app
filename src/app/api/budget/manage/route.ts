import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Budget Management API
 * GET: Get user's budgets for a month
 * POST: Create or update a budget
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

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Get budgets for the month
    const budgets = await dbClient.getUserBudgets(user.id, month, year);

    return NextResponse.json({
      success: true,
      data: { budgets, month, year },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to get budgets:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "fetch_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}

export async function POST(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    const body = await request.json();
    const { userEmail, categoryId, month, year, budgetedAmount } = body;

    if (
      !userEmail ||
      !categoryId ||
      !month ||
      !year ||
      budgetedAmount === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_fields",
          message:
            "userEmail, categoryId, month, year, and budgetedAmount are required",
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Create or update budget
    const budget = await dbClient.createOrUpdateBudget(
      user.id,
      categoryId,
      month,
      year,
      parseFloat(budgetedAmount)
    );

    return NextResponse.json({
      success: true,
      data: { budget },
      message: "Budget saved successfully",
    });
  } catch (error: unknown) {
    console.error("❌ Failed to save budget:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "save_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}
