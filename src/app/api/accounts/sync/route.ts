import { NextRequest, NextResponse } from "next/server";
import { SpareBank1Client } from "@/lib/sparebank1-client";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Clean Account Sync API
 * - Uses SpareBank1Client for API calls only
 * - Uses DatabaseClient for database operations only
 * - No field mapping, no transformations
 * - Caches results for 24 hours
 */
export async function POST(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    console.log("🔄 Starting clean account sync...");

    const { accessToken, userEmail } = await request.json();

    if (!accessToken || !userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_parameters",
          message: "Access token and user email are required",
        },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await dbClient.getOrCreateUser(userEmail);
    console.log("✅ User found/created:", user.id);

    // Check if accounts were already synced today
    const syncedToday = await dbClient.accountsSyncedToday(user.id);

    if (syncedToday) {
      console.log("✅ Accounts already synced today, returning cached data");
      const accounts = await dbClient.getAccounts(user.id);

      return NextResponse.json({
        success: true,
        message: "Accounts already synced today - returning cached data",
        data: {
          accounts,
          cached: true,
          syncedAt: new Date().toISOString(),
        },
      });
    }

    // Create SpareBank1 client and fetch accounts
    const spareBank1Client = new SpareBank1Client(accessToken);
    console.log("🔄 Fetching accounts from SpareBank1...");

    const spareBank1Accounts = await spareBank1Client.getAccounts();
    console.log(
      `📦 Received ${spareBank1Accounts.length} accounts from SpareBank1`
    );

    // Filter to target accounts only (your specific account numbers)
    const targetAccountNumbers = ["32092736910", "32042120676"];
    const targetAccounts = spareBank1Accounts.filter((account) =>
      targetAccountNumbers.includes(account.accountNumber)
    );

    console.log(`🎯 Filtered to ${targetAccounts.length} target accounts`);

    if (targetAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "no_target_accounts",
          message: "No target accounts found in SpareBank1 response",
        },
        { status: 404 }
      );
    }

    // Save accounts to database (exact SpareBank1 data)
    await dbClient.saveAccounts(user.id, targetAccounts);

    // Get saved accounts for response
    const savedAccounts = await dbClient.getAccounts(user.id);

    console.log("✅ Account sync completed successfully");

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${targetAccounts.length} target accounts`,
      data: {
        accounts: savedAccounts,
        cached: false,
        syncedAt: new Date().toISOString(),
        targetAccountNumbers,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Account sync failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "sync_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}
