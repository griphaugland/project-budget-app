import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Monthly Budget Goal API
 * GET: Get monthly budget goal
 * POST: Set monthly budget goal
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

    // Get monthly budget goal
    const goal = await dbClient.getMonthlyBudgetGoal(user.id, month, year);

    return NextResponse.json({
      success: true,
      data: goal ? {
        totalBudget: Number(goal.total_budget),
        notes: goal.notes,
        month,
        year,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
      } : null,
    });
  } catch (error: unknown) {
    console.error("❌ Failed to get monthly budget goal:", error);

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
    const { userEmail, month, year, totalBudget, notes } = body;

    if (!userEmail || !month || !year || totalBudget === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_fields",
          message: "userEmail, month, year, and totalBudget are required",
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Set monthly budget goal
    const goal = await dbClient.setMonthlyBudgetGoal(
      user.id,
      month,
      year,
      parseFloat(totalBudget),
      notes
    );

    return NextResponse.json({
      success: true,
      data: {
        totalBudget: Number(goal.total_budget),
        notes: goal.notes,
        month,
        year,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
      },
      message: "Monthly budget goal saved successfully",
    });
  } catch (error: unknown) {
    console.error("❌ Failed to save monthly budget goal:", error);

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