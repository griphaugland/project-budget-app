import { NextRequest, NextResponse } from "next/server";
import { SpareBank1Client } from "@/lib/sparebank1-client";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Clean Transaction Sync API
 * - Uses SpareBank1Client for API calls only
 * - Uses DatabaseClient for database operations only
 * - No field mapping, no transformations
 * - Automatic duplicate detection based on SpareBank1 ID
 */
export async function POST(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    console.log("🔄 Starting clean transaction sync...");

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

    // Get user's accounts from database (should be synced first)
    const accounts = await dbClient.getAccounts(user.id);

    if (accounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "no_accounts",
          message:
            "No accounts found. Please sync accounts first via /api/accounts/sync",
        },
        { status: 404 }
      );
    }

    console.log(
      `📊 Found ${accounts.length} accounts to sync transactions for`
    );

    // Create SpareBank1 client and fetch transactions
    const spareBank1Client = new SpareBank1Client(accessToken);

    // Get account keys for transaction fetch
    const accountKeys = accounts.map((account) => account.key);

    console.log("🔄 Fetching transactions from SpareBank1...");

    // Fetch transactions for the last 90 days
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);

    const spareBank1Transactions = await spareBank1Client.getTransactions({
      accountKey: accountKeys,
      fromDate: fromDate.toISOString().split("T")[0], // yyyy-MM-dd
      toDate: toDate.toISOString().split("T")[0], // yyyy-MM-dd
      rowLimit: 1000,
      source: "ALL",
    });

    console.log(
      `📦 Received ${spareBank1Transactions.length} transactions from SpareBank1`
    );

    if (spareBank1Transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new transactions found",
        data: {
          saved: 0,
          skipped: 0,
          total: 0,
        },
      });
    }

    // Save transactions to database (exact SpareBank1 data, automatic duplicate detection)
    const result = await dbClient.saveTransactions(
      user.id,
      spareBank1Transactions
    );

    console.log(
      `✅ Transaction sync completed: ${result.saved} saved, ${result.skipped} skipped`
    );

    return NextResponse.json({
      success: true,
      message: `Transaction sync completed successfully`,
      data: {
        saved: result.saved,
        skipped: result.skipped,
        total: spareBank1Transactions.length,
        dateRange: {
          from: fromDate.toISOString().split("T")[0],
          to: toDate.toISOString().split("T")[0],
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ Transaction sync failed:", error);

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
