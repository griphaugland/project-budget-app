import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSpareBank1Client } from "@/lib/sparebank1";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing SpareBank1 API connectivity...");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          message: "Please sign in with SpareBank1 first",
        },
        { status: 401 }
      );
    }

    console.log("✅ User authenticated:", session.user.email);

    // Check if we have access token
    if (!session.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No access token",
          message: "SpareBank1 access token not found. Please sign in again.",
        },
        { status: 401 }
      );
    }

    console.log(
      "✅ Access token found:",
      session.accessToken.slice(0, 20) + "..."
    );

    // Test SpareBank1 API connectivity
    const client = await getSpareBank1Client();

    console.log("🔄 Testing SpareBank1 API call...");

    // Try to get accounts (this is a basic test call)
    const accounts = await client.getAccounts();
    console.log("accounts", accounts);
    console.log("✅ SpareBank1 API call successful!");
    console.log("📊 Accounts found:", accounts?.length || 0);

    // Test getting balance for first account if available
    let balanceTest = null;
    if (accounts && accounts.length > 0) {
      try {
        console.log("🔄 Testing balance API call...");
        balanceTest = await client.getAccountBalance(accounts[0].accountKey);
        console.log("✅ Balance API call successful!");
      } catch (balanceError) {
        console.warn("⚠️ Balance API call failed:", balanceError);
        balanceTest = {
          error: "Balance fetch failed",
          details: balanceError.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: "SpareBank1 API connectivity test successful!",
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        authentication: {
          hasAccessToken: !!session.accessToken,
          tokenPreview: session.accessToken?.slice(0, 20) + "...",
          hasRefreshToken: !!session.refreshToken,
          expiresAt: session.expiresAt,
        },
        sparebank1Test: {
          apiConnected: true,
          accountsCount: accounts?.length || 0,
          accounts:
            accounts?.map((acc) => ({
              accountKey: acc.accountKey,
              name: acc.name,
              type: acc.type,
              isDefault: acc.isDefault,
            })) || [],
          balanceTest,
        },
      },
    });
  } catch (error) {
    console.error("❌ SpareBank1 API test failed:", error);

    let errorMessage = "Unknown error occurred";
    let errorType = "unknown";

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes("access token")) {
        errorType = "authentication";
      } else if (
        error.message.includes("network") ||
        error.message.includes("connect")
      ) {
        errorType = "network";
      } else if (
        error.message.includes("unauthorized") ||
        error.message.includes("401")
      ) {
        errorType = "authorization";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorType,
        message: errorMessage,
        troubleshooting: {
          authentication: "Try signing out and signing in again",
          network: "Check your internet connection and SpareBank1 API status",
          authorization:
            "Verify your SpareBank1 client credentials in .env.local",
          unknown: "Check server logs for more details",
        },
      },
      { status: 500 }
    );
  }
}
