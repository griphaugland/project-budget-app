import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/sparebank1-oauth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 OAuth callback received");

    // Extract code and state from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Check for OAuth errors first
    if (error) {
      console.error("❌ OAuth error received:", {
        error,
        error_description: errorDescription,
      });

      // Redirect to main page with error message
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("oauth_error", error);
      redirectUrl.searchParams.set(
        "error_description",
        errorDescription || "OAuth authentication failed"
      );

      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("❌ Missing required OAuth parameters:", {
        code: !!code,
        state: !!state,
      });

      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("oauth_error", "missing_parameters");
      redirectUrl.searchParams.set(
        "error_description",
        "Missing authorization code or state parameter"
      );

      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ Valid OAuth callback parameters received:", {
      code: code.slice(0, 20) + "...",
      state,
    });

    // Exchange authorization code for access tokens
    console.log("🔄 Exchanging authorization code for tokens...");
    const tokens = await exchangeCodeForTokens(code, state);

    console.log("✅ Token exchange successful:", {
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });

    // Store tokens in sessionStorage via URL parameters (will be handled by frontend)
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("oauth_success", "true");
    redirectUrl.searchParams.set("access_token", tokens.access_token);
    redirectUrl.searchParams.set("refresh_token", tokens.refresh_token);
    redirectUrl.searchParams.set("expires_in", tokens.expires_in.toString());
    redirectUrl.searchParams.set("token_type", tokens.token_type);

    console.log("🚀 Redirecting to main page with tokens");

    return NextResponse.redirect(redirectUrl);
  } catch (error: unknown) {
    console.error("❌ OAuth callback processing failed:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during token exchange";

    // Redirect to main page with error
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("oauth_error", "token_exchange_failed");
    redirectUrl.searchParams.set("error_description", errorMessage);

    return NextResponse.redirect(redirectUrl);
  }
}
