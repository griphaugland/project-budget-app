// Simple token-based authentication for SpareBank1 API
export interface SpareBank1Auth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
}

// Store auth tokens (you can later move this to a more persistent store)
let authTokens: SpareBank1Auth | null = null;

export function setSpareBank1Auth(auth: SpareBank1Auth) {
  authTokens = {
    ...auth,
    expiresAt: auth.expiresAt || new Date(Date.now() + 10 * 60 * 1000), // Default 10 minutes
  };

  // Also store in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("sparebank1_auth", JSON.stringify(authTokens));
  }

  console.log("✅ SpareBank1 authentication set:", {
    hasToken: !!auth.accessToken,
    tokenPreview: auth.accessToken?.slice(0, 20) + "...",
    expiresAt: authTokens.expiresAt,
  });
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
        authTokens = JSON.parse(stored);
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

  if (auth.expiresAt && new Date() > auth.expiresAt) {
    console.warn("⚠️ SpareBank1 token has expired");
    return false;
  }

  return true;
}

export function getValidAccessToken(): string | null {
  if (!isTokenValid()) {
    return null;
  }

  const auth = getSpareBank1Auth();
  return auth?.accessToken || null;
}

// Refresh token function (for when you implement refresh logic)
export async function refreshSpareBank1Token(): Promise<boolean> {
  const auth = getSpareBank1Auth();
  if (!auth?.refreshToken) {
    console.error("No refresh token available");
    return false;
  }

  try {
    // TODO: Implement refresh token API call
    // This would be a POST request to SpareBank1's token endpoint
    // with your refresh token
    console.log("🔄 Token refresh not yet implemented");
    return false;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return false;
  }
}
