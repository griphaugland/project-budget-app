"use server";
/**
 * SpareBank1 OAuth utilities for handling the complete OAuth flow
 */

export interface SpareBank1OAuthConfig {
  clientId: string;
  clientSecret: string;
  financialInstitution: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  state: string;
}

export interface AuthorizationUrlParams {
  state?: string;
  scope?: string;
}

/**
 * Get OAuth configuration from environment variables
 */
export async function getSpareBank1OAuthConfig(): Promise<SpareBank1OAuthConfig> {
  const config = {
    clientId: process.env.SPAREBANK1_CLIENT_ID!,
    clientSecret: process.env.SPAREBANK1_CLIENT_SECRET!,
    financialInstitution: process.env.SPAREBANK1_FIN_INST!,
    redirectUri: process.env.SPAREBANK1_REDIRECT_URI!,
  };
  console.log(config);
  // Validate required config
  const missing = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing SpareBank1 OAuth configuration: ${missing.join(", ")}`
    );
  }

  return config;
}

/**
 * Generate the SpareBank1 authorization URL
 * User visits this URL to log in with their birth number
 */
export async function generateAuthorizationUrl(
  params: AuthorizationUrlParams = {}
): Promise<string> {
  const config = await getSpareBank1OAuthConfig();

  // State must be provided as parameter (from user input)
  if (!params.state) {
    throw new Error(
      "State parameter is required for authorization URL generation"
    );
  }

  const authUrl = new URL("https://api.sparebank1.no/oauth/authorize");

  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("state", params.state);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("finInst", config.financialInstitution);
  authUrl.searchParams.set("response_type", "code");

  // Don't include scope parameter to match expected URL format

  console.log("🔗 Generated SpareBank1 authorization URL:", authUrl.toString());

  return authUrl.toString();
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  authorizationCode: string,
  state: string
): Promise<TokenResponse> {
  const config = await getSpareBank1OAuthConfig();

  console.log("🔄 Exchanging authorization code for tokens...");

  const response = await fetch("https://api.sparebank1.no/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
      state: state,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Token exchange failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(
      `Token exchange failed: ${response.status} ${response.statusText}`
    );
  }

  const tokens: TokenResponse = await response.json();

  console.log("✅ Tokens received successfully:", {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type,
  });

  return tokens;
}

/**
 * Refresh access token using refresh token
 * Access tokens expire in 10 minutes, refresh tokens expire in 365 days
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const config = await getSpareBank1OAuthConfig();

  console.log("🔄 Refreshing access token...");

  const response = await fetch("https://api.sparebank1.no/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Token refresh failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(
      `Token refresh failed: ${response.status} ${response.statusText}`
    );
  }

  const tokens: TokenResponse = await response.json();

  console.log("✅ Tokens refreshed successfully:", {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type,
  });

  return tokens;
}

/**
 * Generate a random state parameter for OAuth security
 */
function generateRandomState(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
