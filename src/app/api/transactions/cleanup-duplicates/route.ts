import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Clean Transaction Duplicates API
 * - Finds and removes duplicate transactions based on amount + date + description
 * - Keeps the oldest transaction in each duplicate group
 */
export async function POST(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    console.log("🧹 Starting duplicate transaction cleanup...");

    // Parse request body
    const body = await request.json();
    const { userEmail } = body;

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
    console.log("✅ User found:", user.id);

    // Run duplicate cleanup
    const result = await dbClient.findAndRemoveDuplicates(user.id);

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: Found ${result.duplicatesFound} duplicates in ${result.duplicateGroups.length} groups, removed ${result.duplicatesRemoved}`,
      data: {
        duplicatesFound: result.duplicatesFound,
        duplicatesRemoved: result.duplicatesRemoved,
        duplicateGroups: result.duplicateGroups.map((group) => ({
          amount: group.amount,
          date: new Date(Number(group.date)).toISOString(), // Convert BigInt to ISO string
          description: group.description,
          count: group.count,
          kept: group.kept,
          removed: group.removed,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to cleanup duplicates:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "cleanup_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}
