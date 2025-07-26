"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  setSpareBank1Auth,
  getSpareBank1Auth,
  clearSpareBank1Auth,
  isTokenValid,
  type SpareBank1Auth,
} from "@/lib/auth-simple";

interface SpareBank1TokenAuthProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function SpareBank1TokenAuth({
  onAuthChange,
}: SpareBank1TokenAuthProps) {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAuth, setCurrentAuth] = useState<SpareBank1Auth | null>(null);
  const [showTokenForm, setShowTokenForm] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const auth = getSpareBank1Auth();
    const valid = isTokenValid();

    setCurrentAuth(auth);
    setIsAuthenticated(valid);
    setShowTokenForm(!valid);

    onAuthChange?.(valid);
  };

  const handleSaveTokens = () => {
    if (!accessToken.trim()) {
      alert("Please enter an access token");
      return;
    }

    const auth: SpareBank1Auth = {
      accessToken: accessToken.trim(),
      refreshToken: refreshToken.trim() || undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      tokenType: "Bearer",
    };

    setSpareBank1Auth(auth);
    setAccessToken("");
    setRefreshToken("");
    checkAuthStatus();
  };

  const handleClearAuth = () => {
    clearSpareBank1Auth();
    setAccessToken("");
    setRefreshToken("");
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
            SpareBank1 Authentication
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isAuthenticated
              ? "You are authenticated with SpareBank1"
              : "Enter your SpareBank1 access token to get started"}
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

      {isAuthenticated && currentAuth ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
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

          <div className="flex space-x-2">
            <Button
              onClick={() => setShowTokenForm(!showTokenForm)}
              variant="outline"
              size="sm"
            >
              {showTokenForm ? "Hide" : "Update"} Tokens
            </Button>
            <Button onClick={handleClearAuth} variant="destructive" size="sm">
              Clear Authentication
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>To get your tokens:</strong>
          </p>
          <ol className="text-yellow-700 dark:text-yellow-300 text-xs mt-2 space-y-1 list-decimal list-inside">
            <li>Go to the SpareBank1 developer portal</li>
            <li>Complete the OAuth flow and get your authorization code</li>
            <li>Exchange the code for access and refresh tokens</li>
            <li>Paste the tokens below</li>
          </ol>
        </div>
      )}

      {showTokenForm && (
        <div className="space-y-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Access Token *
            </label>
            <textarea
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste your SpareBank1 access token here..."
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Refresh Token (optional)
            </label>
            <textarea
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="Paste your SpareBank1 refresh token here (optional)..."
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono"
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSaveTokens} className="flex-1">
              Save Tokens
            </Button>
            {isAuthenticated && (
              <Button onClick={() => setShowTokenForm(false)} variant="outline">
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
