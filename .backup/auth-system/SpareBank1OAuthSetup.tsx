"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  setSpareBank1AuthFromTokens,
  getSpareBank1Auth,
  clearSpareBank1Auth,
  isTokenValid,
  type SpareBank1Auth,
} from "@/lib/auth-simple";

interface SpareBank1OAuthSetupProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function SpareBank1OAuthSetup({
  onAuthChange,
}: SpareBank1OAuthSetupProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAuth, setCurrentAuth] = useState<SpareBank1Auth | null>(null);
  const [authStep, setAuthStep] = useState<
    "start" | "waiting" | "processing" | "complete"
  >("start");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stateInput, setStateInput] = useState("");

  useEffect(() => {
    const initializeAuth = () => {
      checkAuthStatus();
      checkForCallbackParams();
    };
    initializeAuth();
  }, []);

  const checkAuthStatus = () => {
    const auth = getSpareBank1Auth();
    const valid = isTokenValid();

    setCurrentAuth(auth);
    setIsAuthenticated(valid);

    if (valid) {
      setAuthStep("complete");
    }

    onAuthChange?.(valid);
  };

  const checkForCallbackParams = async () => {
    // Check if we have callback parameters in the URL
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);

    // Check for OAuth success (tokens from server-side callback)
    const oauthSuccess = urlParams.get("oauth_success");
    const accessToken = urlParams.get("access_token");
    const refreshToken = urlParams.get("refresh_token");
    const expiresIn = urlParams.get("expires_in");
    const tokenType = urlParams.get("token_type");

    // Check for OAuth errors
    const oauthError = urlParams.get("oauth_error");
    const errorDescription = urlParams.get("error_description");

    if (oauthSuccess && accessToken && refreshToken) {
      console.log("🔍 Found OAuth success tokens in URL, processing...");
      setAuthStep("processing");
      setLoading(true);

      try {
        // Store tokens directly (already exchanged on server)
        const tokenData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: parseInt(expiresIn || "600", 10),
          token_type: tokenType || "Bearer",
          state: "callback", // Default state for server-side callbacks
        };

        setSpareBank1AuthFromTokens(tokenData);

        console.log(
          "✅ OAuth flow completed successfully via server callback!"
        );

        // Clean up URL parameters
        const newUrl =
          window.location.protocol +
          "//" +
          window.location.host +
          window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        checkAuthStatus();
      } catch (error) {
        console.error("Failed to store OAuth tokens:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to store authentication tokens"
        );
        setAuthStep("start");
      } finally {
        setLoading(false);
      }
    } else if (oauthError) {
      console.error("❌ OAuth error received:", {
        error: oauthError,
        description: errorDescription,
      });

      setError(
        errorDescription || `OAuth authentication failed: ${oauthError}`
      );
      setAuthStep("start");

      // Clean up URL parameters
      const newUrl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Legacy support: Check for code/state (direct callback, not via server)
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state && !oauthSuccess && !oauthError) {
      console.log(
        "🔍 Found legacy callback parameters, redirecting to server callback..."
      );

      // Redirect to server-side callback to handle the exchange
      const callbackUrl = `/api/oauth/callback?code=${encodeURIComponent(
        code
      )}&state=${encodeURIComponent(state)}`;
      window.location.href = callbackUrl;
    }
  };

  const startOAuthFlow = async () => {
    try {
      setError("");

      // Validate state input
      if (!stateInput.trim()) {
        setError(
          "Please enter the state value from SpareBank1 developer portal"
        );
        return;
      }

      setLoading(true);

      // Call API route to generate authorization URL with user-provided state
      const response = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: stateInput.trim() }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to generate authorization URL"
        );
      }

      setAuthStep("waiting");

      // Redirect to SpareBank1 authorization URL
      window.location.href = result.data.authorizationUrl;
    } catch (error) {
      console.error("Failed to start OAuth flow:", error);
      setError(
        error instanceof Error ? error.message : "Failed to start OAuth flow"
      );
      setLoading(false);
    }
  };

  const handleClearAuth = () => {
    clearSpareBank1Auth();
    setAuthStep("start");
    setError("");
    setStateInput(""); // Clear state input field
    checkAuthStatus();
  };

  const formatTokenDisplay = (token: string, length = 20) => {
    if (token.length <= length) return token;
    return token.slice(0, length) + "...";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            SpareBank1 OAuth Authentication
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isAuthenticated
              ? "Successfully authenticated with SpareBank1"
              : authStep === "processing"
              ? "Processing OAuth callback..."
              : "Click below to authenticate with SpareBank1"}
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 dark:text-green-400">
              Connected
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Start OAuth Flow */}
      {authStep === "start" && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🔐 SpareBank1 OAuth Flow
            </h3>
            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 list-disc list-inside">
              <li>Get the state value from SpareBank1 developer portal</li>
              <li>Enter the state value below</li>
              <li>Click login to redirect to SpareBank1</li>
              <li>Log in with your birth number (fødselsnummer)</li>
              <li>You&apos;ll be redirected back with authentication tokens</li>
            </ul>
          </div>

          <div>
            <label
              htmlFor="state-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              State (from SpareBank1 developer portal)
            </label>
            <input
              id="state-input"
              type="text"
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="e.g., 7229413"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              disabled={loading}
            />
          </div>

          <Button
            onClick={startOAuthFlow}
            loading={loading}
            className="w-full"
            disabled={loading || !stateInput.trim()}
          >
            {loading ? "🔄 Starting OAuth Flow..." : "🚀 Login with SpareBank1"}
          </Button>
        </div>
      )}

      {/* Step 2: Processing Callback */}
      {authStep === "processing" && (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              🔄 Processing Authentication
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Exchanging authorization code for access tokens...
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Authenticated */}
      {authStep === "complete" && currentAuth && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">
              ✅ Successfully Authenticated
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Access Token:
                </span>
                <code className="ml-2 text-green-700 dark:text-green-300">
                  {formatTokenDisplay(currentAuth.accessToken)}
                </code>
              </div>
              {currentAuth.refreshToken && (
                <div>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Refresh Token:
                  </span>
                  <code className="ml-2 text-green-700 dark:text-green-300">
                    {formatTokenDisplay(currentAuth.refreshToken)}
                  </code>
                </div>
              )}
              <div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Expires:
                </span>
                <span className="ml-2 text-green-700 dark:text-green-300">
                  {currentAuth.expiresAt?.toLocaleString() || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🔄 Token Management
            </h3>
            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
              <li>• Access tokens auto-refresh every 10 minutes</li>
              <li>• Refresh tokens valid for 365 days</li>
              <li>• All API calls use fresh tokens automatically</li>
            </ul>
          </div>

          <Button
            onClick={handleClearAuth}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            🗑️ Logout & Clear Authentication
          </Button>
        </div>
      )}
    </div>
  );
}
