import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/sparebank1-oauth";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_refresh_token",
          message: "Missing refresh token",
        },
        { status: 400 }
      );
    }

    console.log("🔄 Refreshing access token via API route...");

    const tokens = await refreshAccessToken(refreshToken);

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Token refresh failed in API route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "token_refresh_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
