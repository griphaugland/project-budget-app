import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Budget Categories API
 * GET: Get all budget categories
 * POST: Initialize default categories
 */

export async function GET(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const includeIncome = searchParams.get("includeIncome") !== "false";

    const categories = await dbClient.getBudgetCategories(includeIncome);

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to get budget categories:", error);

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
    await dbClient.initializeBudgetCategories();

    return NextResponse.json({
      success: true,
      message: "Budget categories initialized successfully",
    });
  } catch (error: unknown) {
    console.error("❌ Failed to initialize budget categories:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "init_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}
