import { NextRequest, NextResponse } from "next/server";
import { getSpareBank1ClientFromToken } from "@/lib/sparebank1-simple";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting account sync (simple auth)...");

    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No access token provided",
          message: "Please provide a valid SpareBank1 access token",
        },
        { status: 400 }
      );
    }

    console.log("✅ Access token provided for sync");

    // Create SpareBank1 client
    const client = getSpareBank1ClientFromToken(accessToken);

    console.log("🔄 Fetching accounts from SpareBank1...");

    // Fetch accounts from SpareBank1 API (includes balance data)
    const accounts = await client.getAccounts();

    console.log("✅ Accounts fetched successfully:", accounts?.length || 0);

    // Transform accounts data (balance is already included in the response)
    const accountsWithBalances = accounts.map((account) => {
      console.log(
        `✅ Account processed: ${account.name} - Balance: ${account.balance.amount} ${account.balance.currency}`
      );

      return {
        accountKey: account.accountKey,
        accountName: account.name,
        accountType: account.type,
        balance: account.balance.amount,
        currency: account.balance.currency,
        isDefault: account.isDefault || false,
        // Add some metadata for tracking
        lastSynced: new Date().toISOString(),
        source: "sparebank1-api",
      };
    });

    console.log("✅ Account sync completed successfully");

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${accountsWithBalances.length} accounts from SpareBank1`,
      data: {
        accounts: accountsWithBalances,
        syncedAt: new Date().toISOString(),
        source: "sparebank1-api",
        note: "Balance data included directly from accounts API - no separate balance calls needed!",
      },
    });
  } catch (error: unknown) {
    console.error("❌ Account sync failed:", error);

    let errorMessage = "Failed to sync accounts from SpareBank1";
    let errorType = "unknown";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        errorType = "authorization";
        statusCode = 401;
        errorMessage = "Invalid or expired access token";
      } else if (
        error.message.includes("403") ||
        error.message.includes("forbidden")
      ) {
        errorType = "permissions";
        statusCode = 403;
        errorMessage = "Access forbidden - insufficient permissions";
      } else if (
        error.message.includes("network") ||
        error.message.includes("connect")
      ) {
        errorType = "network";
        errorMessage = "Network connection error";
      } else if (error.message.includes("timeout")) {
        errorType = "timeout";
        errorMessage = "Request timed out";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorType,
        message: errorMessage,
        troubleshooting: {
          authorization:
            "Your access token is invalid or expired. Get a new token.",
          permissions:
            "Your token may not have access to account data. Check scope.",
          network: "Check internet connection and SpareBank1 API status.",
          timeout: "Request timed out. Try again.",
          unknown: "Check server logs for details.",
        },
      },
      { status: statusCode }
    );
  }
}
