import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * August 2025 Budget Analysis API
 * GET: Get comprehensive August budget analysis with projections
 */

export async function GET(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const year = parseInt(searchParams.get("year") || "2025");

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

    console.log(`🎯 Getting August ${year} budget analysis for ${userEmail}`);

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Get comprehensive August analysis
    const augustAnalysis = await dbClient.getAugustBudgetAnalysis(user.id, year);

    return NextResponse.json({
      success: true,
      data: augustAnalysis,
    });
  } catch (error: unknown) {
    console.error("❌ Failed to get August budget analysis:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "august_analysis_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}