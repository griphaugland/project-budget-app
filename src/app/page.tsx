"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SpareBank1TokenAuth } from "@/components/SpareBank1TokenAuth";
import { getValidAccessToken } from "@/lib/auth-simple";

interface TestResult {
  success: boolean;
  error?: string;
  message: string;
  data?: {
    authentication?: {
      tokenPreview?: string;
    };
    sparebank1Test?: {
      accountsCount?: number;
      accounts?: Array<{
        name: string;
        type: string;
      }>;
    };
  };
  troubleshooting?: Record<string, string>;
}

interface BankAccount {
  accountKey: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  lastSynced: string;
  source: string;
  balanceError?: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setAccounts([]);
      setTestResult(null);
      setError("");
    }
  };

  console.log(accounts);
  const testSpareBank1Connectivity = async () => {
    const accessToken = getValidAccessToken();

    if (!accessToken) {
      setError("No valid access token available");
      return;
    }

    try {
      setTestLoading(true);
      setTestResult(null);
      setError("");

      const response = await fetch("/api/test-sparebank1-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        console.log("✅ SpareBank1 API test successful:", result);
      } else {
        console.error("❌ SpareBank1 API test failed:", result);
        setError(result.message || "API test failed");
      }
    } catch (err) {
      console.error("Test failed:", err);
      const errorMsg = "Failed to run connectivity test";
      setError(errorMsg);
      setTestResult({
        success: false,
        error: "network",
        message: errorMsg,
      });
    } finally {
      setTestLoading(false);
    }
  };

  const syncAccounts = async () => {
    const accessToken = getValidAccessToken();

    if (!accessToken) {
      setError("No valid access token available");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/accounts/sync-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const result = await response.json();

      if (result.success) {
        setAccounts(result.data.accounts || []);
        console.log("✅ Accounts synced successfully:", result);
      } else {
        throw new Error(result.message || "Failed to sync accounts");
      }
    } catch (err) {
      console.error("Error syncing accounts:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sync accounts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              SpareBank1 Budget App
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Personal finance dashboard with direct SpareBank1 API integration
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="py-8 space-y-8">
          {/* Authentication Section */}
          <SpareBank1TokenAuth onAuthChange={handleAuthChange} />

          {/* API Test Section - only show if authenticated */}
          {isAuthenticated && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    SpareBank1 API Test
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Test your SpareBank1 API connectivity and fetch account data
                  </p>
                </div>
                <Button
                  onClick={testSpareBank1Connectivity}
                  loading={testLoading}
                  size="sm"
                >
                  Test API Connection
                </Button>
              </div>

              {testResult && (
                <div
                  className={`mt-4 p-4 rounded-lg border ${
                    testResult.success
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        testResult.success ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p
                        className={`font-medium text-sm ${
                          testResult.success
                            ? "text-green-800 dark:text-green-200"
                            : "text-red-800 dark:text-red-200"
                        }`}
                      >
                        {testResult.message}
                      </p>

                      {testResult.success && testResult.data && (
                        <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                          <p>
                            ✅ Token:{" "}
                            {testResult.data.authentication?.tokenPreview}
                          </p>
                          <p>
                            ✅ Accounts Found:{" "}
                            {testResult.data.sparebank1Test?.accountsCount || 0}
                          </p>
                          {testResult.data.sparebank1Test?.accounts?.map(
                            (acc, i: number) => (
                              <p key={i}>
                                {" "}
                                • {acc.name} ({acc.type})
                              </p>
                            )
                          )}
                        </div>
                      )}

                      {!testResult.success && testResult.troubleshooting && (
                        <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                          <p>
                            <strong>Suggestion:</strong>{" "}
                            {testResult.troubleshooting[
                              testResult.error || "unknown"
                            ] || testResult.troubleshooting.unknown}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accounts Section - only show if authenticated */}
          {isAuthenticated && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Bank Accounts
                </h2>
                <Button onClick={syncAccounts} loading={loading} size="sm">
                  Sync Accounts
                </Button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
              ) : accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.map((account: BankAccount) => (
                    <div
                      key={account.accountKey}
                      className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {account.accountName}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {account.accountType}
                      </p>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat("nb-NO", {
                          style: "currency",
                          currency: account.currency,
                        }).format(account.balance)}
                      </div>
                      {account.isDefault && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          Default Account
                        </span>
                      )}
                      {account.balanceError && (
                        <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                          Balance Error
                        </span>
                      )}
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Last synced:{" "}
                        {new Date(account.lastSynced).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No accounts found. Click &quot;Sync Accounts&quot; to fetch
                    your bank accounts from SpareBank1.
                  </p>
                  <Button onClick={syncAccounts} loading={loading}>
                    Sync Bank Accounts
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          {isAuthenticated && (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Development Progress
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• ✅ Direct token-based authentication</li>
                <li>• ✅ Real SpareBank1 API integration</li>
                <li>• ✅ Account fetching and balance retrieval</li>
                <li>• 🔄 Transaction import and categorization</li>
                <li>• 📊 Budget creation and tracking</li>
                <li>• 📈 Analytics and reporting</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
