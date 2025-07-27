import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/sparebank1-oauth";

export async function POST(request: Request) {
  try {
    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_parameters",
          message: "Missing code or state parameter",
        },
        { status: 400 }
      );
    }

    console.log("🔄 Exchanging authorization code for tokens via API route...");

    const tokens = await exchangeCodeForTokens(code, state);

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
    console.error("❌ Token exchange failed in API route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "token_exchange_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
