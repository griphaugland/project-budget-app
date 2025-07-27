import { NextResponse } from "next/server";
import { getSpareBank1OAuthConfig } from "@/lib/sparebank1-oauth";
import { generateAuthorizationUrl } from "@/lib/auth-simple";

export async function GET() {
  try {
    console.log("🔍 Checking SpareBank1 OAuth configuration...");

    // Check if OAuth configuration is complete
    const config = getSpareBank1OAuthConfig();

    // Generate a sample authorization URL
    const sampleAuthUrl = generateAuthorizationUrl({
      state: "sample_state_123",
      scope: "accounts transactions",
    });

    return NextResponse.json({
      success: true,
      message: "SpareBank1 OAuth configuration is valid",
      data: {
        configuration: {
          hasClientId: !!config.clientId,
          hasClientSecret: !!config.clientSecret,
          hasFinancialInstitution: !!config.financialInstitution,
          redirectUri: config.redirectUri,
          clientIdPreview: config.clientId
            ? config.clientId.slice(0, 8) + "..."
            : "not set",
        },
        sampleAuthUrl,
        instructions: {
          step1:
            "User visits the authorization URL and logs in with birth number",
          step2:
            "After login, user is redirected to redirect_uri with authorization code",
          step3: "Extract the code parameter from the callback URL",
          step4: "Exchange the code for access and refresh tokens",
          tokenLifetime: {
            accessToken: "10 minutes",
            refreshToken: "365 days",
          },
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ OAuth configuration check failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown configuration error";

    return NextResponse.json(
      {
        success: false,
        error: "configuration_error",
        message: errorMessage,
        troubleshooting: {
          missing_env_vars:
            "Check that all required environment variables are set in .env.local",
          required_vars: [
            "SPAREBANK1_CLIENT_ID",
            "SPAREBANK1_CLIENT_SECRET",
            "SPAREBANK1_FIN_INST",
            "SPAREBANK1_REDIRECT_URI",
          ],
          example_env: {
            SPAREBANK1_CLIENT_ID:
              "your_client_id_from_sparebank1_developer_portal",
            SPAREBANK1_CLIENT_SECRET:
              "your_client_secret_from_sparebank1_developer_portal",
            SPAREBANK1_FIN_INST: "your_bank_code_like_0057",
            SPAREBANK1_REDIRECT_URI: "http://localhost:3000/auth/callback",
          },
        },
      },
      { status: 400 }
    );
  }
}
