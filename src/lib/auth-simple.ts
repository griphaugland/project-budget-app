// Enhanced SpareBank1 authentication with OAuth support
export interface SpareBank1Auth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
}

// Store auth tokens (persisted in localStorage)
let authTokens: SpareBank1Auth | null = null;

export function setSpareBank1Auth(auth: SpareBank1Auth) {
  authTokens = {
    ...auth,
    expiresAt: auth.expiresAt || new Date(Date.now() + 10 * 60 * 1000), // Default 10 minutes
  };

  // Store in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("sparebank1_auth", JSON.stringify(authTokens));
  }

  console.log("✅ SpareBank1 authentication set:", {
    hasToken: !!auth.accessToken,
    tokenPreview: auth.accessToken?.slice(0, 20) + "...",
    expiresAt: authTokens.expiresAt,
    hasRefreshToken: !!auth.refreshToken,
  });
}

/**
 * Set tokens from OAuth token response
 */
export function setSpareBank1AuthFromTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  state: string;
}) {
  const auth: SpareBank1Auth = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    tokenType: tokens.token_type,
  };

  setSpareBank1Auth(auth);
}

export function getSpareBank1Auth(): SpareBank1Auth | null {
  // Try memory first
  if (authTokens) {
    return authTokens;
  }

  // Try localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("sparebank1_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert expiresAt string back to Date object
        if (parsed.expiresAt) {
          parsed.expiresAt = new Date(parsed.expiresAt);
        }
        authTokens = parsed;
        return authTokens;
      } catch (error) {
        console.error("Failed to parse stored auth:", error);
        localStorage.removeItem("sparebank1_auth");
      }
    }
  }

  return null;
}

export function clearSpareBank1Auth() {
  authTokens = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("sparebank1_auth");
  }
  console.log("🗑️ SpareBank1 authentication cleared");
}

export function isTokenValid(): boolean {
  const auth = getSpareBank1Auth();
  if (!auth || !auth.accessToken) {
    return false;
  }

  if (auth.expiresAt && isTokenExpired(auth.expiresAt)) {
    console.warn("⚠️ SpareBank1 token has expired");
    return false;
  }

  return true;
}

/**
 * Check if access token is expired (with 30 second buffer)
 */
function isTokenExpired(expiresAt: Date): boolean {
  const now = new Date();
  const thirtySecondsFromNow = new Date(now.getTime() + 30 * 1000);
  return expiresAt < thirtySecondsFromNow;
}

/**
 * Get a valid access token, automatically refreshing if needed
 */
export async function getValidAccessToken(): Promise<string | null> {
  const auth = getSpareBank1Auth();

  if (!auth || !auth.accessToken) {
    console.warn("❌ No access token available");
    return null;
  }

  // If token is still valid, return it
  if (!auth.expiresAt || !isTokenExpired(auth.expiresAt)) {
    return auth.accessToken;
  }

  // Token is expired, try to refresh
  if (!auth.refreshToken) {
    console.warn("❌ Token expired and no refresh token available");
    clearSpareBank1Auth();
    return null;
  }

  try {
    console.log("🔄 Access token expired, attempting refresh...");

    // Call API route to refresh token (server-side only)
    const response = await fetch("/api/oauth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Token refresh failed");
    }

    // Convert API response to our token format
    const tokenData = {
      access_token: result.data.accessToken,
      refresh_token: result.data.refreshToken,
      expires_in: result.data.expiresIn,
      token_type: result.data.tokenType,
      state: "refreshed",
    };

    // Update stored tokens
    setSpareBank1AuthFromTokens(tokenData);

    console.log("✅ Successfully refreshed access token");
    return result.data.accessToken;
  } catch (error) {
    console.error("❌ Failed to refresh token:", error);
    clearSpareBank1Auth();
    return null;
  }
}

/**
 * For backward compatibility - synchronous version that doesn't auto-refresh
 */
export function getValidAccessTokenSync(): string | null {
  if (!isTokenValid()) {
    return null;
  }

  const auth = getSpareBank1Auth();
  return auth?.accessToken || null;
}

/**
 * Parse authorization callback URL to extract code and state
 */
export function parseAuthorizationCallback(
  url: string
): { code: string; state: string } | null {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get("code");
    const state = urlObj.searchParams.get("state");

    if (!code || !state) {
      console.error("❌ Missing code or state in callback URL");
      return null;
    }

    return { code, state };
  } catch (error) {
    console.error("❌ Error parsing callback URL:", error);
    return null;
  }
}

/**
 * Generate the SpareBank1 authorization URL
 * User visits this URL to log in with their birth number
 */
export function generateAuthorizationUrl(
  params: { state: string; scope: string } = {
    state: "",
    scope: "accounts transactions",
  }
): string {
  const config = {
    clientId: process.env.SPAREBANK1_CLIENT_ID || "",
    redirectUri: process.env.SPAREBANK1_REDIRECT_URI || "",
    financialInstitution: process.env.SPAREBANK1_FINANCIAL_INSTITUTION || "",
  };

  const state = params.state || "";
  const scope = params.scope || "accounts transactions";

  const authUrl = new URL("https://api.sparebank1.no/oauth/authorize");

  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("finInst", config.financialInstitution);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);

  console.log("🔗 Generated SpareBank1 authorization URL:", authUrl.toString());

  return authUrl.toString();
}
