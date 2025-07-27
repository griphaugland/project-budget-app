import { NextResponse } from "next/server";
import { generateAuthorizationUrl } from "@/lib/sparebank1-oauth";

export async function POST(request: Request) {
  try {
    const { state } = await request.json();

    if (!state) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_state",
          message: "State parameter is required",
        },
        { status: 400 }
      );
    }

    // Generate authorization URL with user-provided state
    const authUrl = await generateAuthorizationUrl({ state });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: authUrl,
        state: state,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to generate authorization URL:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "oauth_config_error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
