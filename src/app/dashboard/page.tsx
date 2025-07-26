"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchAccounts();
    }
  }, [status, router]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/accounts/sync", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load account data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const testSpareBank1Connectivity = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);

      const response = await fetch("/api/test-sparebank1");
      const result = await response.json();

      setTestResult(result);

      if (result.success) {
        console.log("✅ SpareBank1 API test successful:", result);
      } else {
        console.error("❌ SpareBank1 API test failed:", result);
      }
    } catch (err) {
      console.error("Test failed:", err);
      setTestResult({
        success: false,
        error: "network",
        message: "Failed to run connectivity test",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Welcome back, {session.user?.name || session.user?.email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="py-8 space-y-8">
          {/* SpareBank1 API Test Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  SpareBank1 API Test
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Test your SpareBank1 authentication and API connectivity
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
                        <p>✅ User: {testResult.data.user?.email}</p>
                        <p>
                          ✅ Access Token:{" "}
                          {testResult.data.authentication?.hasAccessToken
                            ? "Present"
                            : "Missing"}
                        </p>
                        <p>
                          ✅ Accounts Found:{" "}
                          {testResult.data.sparebank1Test?.accountsCount || 0}
                        </p>
                        {testResult.data.sparebank1Test?.accounts?.map(
                          (acc: any, i: number) => (
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
                          {testResult.troubleshooting[testResult.error] ||
                            testResult.troubleshooting.unknown}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              SpareBank1 Connection
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">
                Successfully connected to SpareBank1
              </span>
            </div>
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              <p>User ID: {session.user?.id}</p>
              {session.accessToken && (
                <p>Access Token: {session.accessToken.slice(0, 10)}...</p>
              )}
            </div>
          </div>

          {/* Accounts Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Bank Accounts
              </h2>
              <Button onClick={fetchAccounts} loading={loading} size="sm">
                Refresh Accounts
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
                {error.includes("Database connection") && (
                  <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                    Please check your DATABASE_URL configuration in .env.local
                  </p>
                )}
                {error.includes("authentication") && (
                  <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                    Please sign out and sign in again to refresh your SpareBank1
                    connection.
                  </p>
                )}
              </div>
            )}

            {loading ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
              </div>
            ) : accounts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account: any) => (
                  <div
                    key={account.id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  No accounts found. Click "Refresh Accounts" to sync your bank
                  accounts from SpareBank1.
                </p>
                <Button onClick={fetchAccounts} loading={loading}>
                  Sync Bank Accounts
                </Button>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Development Progress
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• ✅ Authentication with SpareBank1</li>
              <li>• ✅ Real account synchronization</li>
              <li>• 🔄 Transaction import and categorization</li>
              <li>• 📊 Budget creation and tracking</li>
              <li>• 📈 Analytics and reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
