import { NextRequest, NextResponse } from "next/server";
import { getSpareBank1ClientFromToken } from "@/lib/sparebank1-simple";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Testing SpareBank1 API connectivity (simple auth)...");

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

    console.log("✅ Access token provided:", accessToken.slice(0, 20) + "...");

    // Test SpareBank1 API connectivity
    const client = getSpareBank1ClientFromToken(accessToken);

    console.log("🔄 Testing SpareBank1 API call...");

    // Try to get accounts (this includes balance information)
    const accounts = await client.getAccounts();

    console.log("✅ SpareBank1 API call successful!");
    console.log("📊 Accounts found:", accounts?.length || 0);

    // No need for separate balance test - balance data is included in accounts response
    console.log("✅ Account balances already included in accounts data!");

    return NextResponse.json({
      success: true,
      message: "SpareBank1 API connectivity test successful!",
      data: {
        authentication: {
          tokenProvided: true,
          tokenPreview: accessToken.slice(0, 20) + "...",
        },
        sparebank1Test: {
          apiConnected: true,
          accountsCount: accounts?.length || 0,
          accounts:
            accounts?.map((acc) => ({
              accountKey: acc.accountKey,
              name: acc.name,
              type: acc.type,
              balance: acc.balance,
              isDefault: acc.isDefault,
            })) || [],
          note: "Balance information is included directly in accounts response - no separate balance API call needed!",
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ SpareBank1 API test failed:", error);

    let errorMessage = "Unknown error occurred";
    let errorType = "unknown";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
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
        errorMessage = "Access forbidden - check your token permissions";
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
            "Your access token is invalid or expired. Get a new token from SpareBank1.",
          permissions:
            "Your token may not have the required permissions. Check your scope settings.",
          network: "Check your internet connection and SpareBank1 API status.",
          timeout: "The request timed out. Try again later.",
          unknown: "Check server logs for more details.",
        },
      },
      { status: statusCode }
    );
  }
}
