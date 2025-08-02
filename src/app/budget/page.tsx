"use client";

import { useState, useEffect } from "react";
import { SpareBank1OAuthSetup } from "@/components/SpareBank1OAuthSetup";
import TransactionList from "@/components/TransactionList";
import {
  getSpareBank1Auth,
  isTokenValid,
  clearSpareBank1Auth,
} from "@/lib/auth-simple";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  currency: string;
  accountName: string;
  account: {
    id: string;
    name: string;
    accountNumber: string;
    type: string;
  } | null;
  typeCode: string;
  source: string;
  bookingStatus: string;
  merchant: Record<string, unknown>;
}

interface Account {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  currencyCode: string;
  type: string;
}

export default function BudgetPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "accounts" | "analytics" | "budget"
  >("dashboard");
  const [syncStatus, setSyncStatus] = useState<{
    accounts: boolean;
    transactions: boolean;
  }>({ accounts: false, transactions: false });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [budgetCategories, setBudgetCategories] = useState<any[]>([]);
  const [augustAnalysis, setAugustAnalysis] = useState<any>(null);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
  const [goalNotes, setGoalNotes] = useState<string>("");

  // Check for existing auth on load
  useEffect(() => {
    const checkAuth = () => {
      const valid = isTokenValid();
      const auth = getSpareBank1Auth();

      if (valid && auth) {
        setAccessToken(auth.accessToken);
        setIsAuthenticated(true);
        console.log("✅ Found valid authentication");
      } else {
        setIsAuthenticated(false);
        setAccessToken(null);
        console.log("❌ No valid authentication found");
      }
    };

    checkAuth();
  }, []);

  // Handle OAuth auth change
  const handleAuthChange = (authenticated: boolean) => {
    if (authenticated) {
      const auth = getSpareBank1Auth();
      if (auth) {
        setAccessToken(auth.accessToken);
        setIsAuthenticated(true);
        console.log("✅ Authentication successful in budget page");
      }
    } else {
      setIsAuthenticated(false);
      setAccessToken(null);
    }
  };

  // Clean duplicate transactions
  const cleanDuplicates = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions/cleanup-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: "user@example.com" }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Duplicates cleaned:", result.message);
        console.log("📊 Cleanup details:", result.data);

        // Refresh transaction list to show updated data
        const updatedTransactions = await fetch(
          `/api/transactions/list?page=1&limit=20&userEmail=user@example.com`
        );
        const transactionResult = await updatedTransactions.json();

        if (transactionResult.success) {
          setTransactions(transactionResult.data.transactions);
        }
      } else {
        setError(result.message || "Failed to clean duplicates");
      }
    } catch (err) {
      setError("Failed to clean duplicates");
      console.error("Duplicate cleanup error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearSpareBank1Auth();
    setAccessToken(null);
    setIsAuthenticated(false);
    setAccounts([]);
    setTransactions([]);
    setSyncStatus({ accounts: false, transactions: false });
    console.log("👋 Logged out successfully");
  };

  // Sync accounts
  const syncAccounts = async () => {
    if (!accessToken || !userEmail) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, userEmail }),
      });

      const result = await response.json();

      if (result.success) {
        setAccounts(result.data.accounts);
        setSyncStatus((prev) => ({ ...prev, accounts: true }));
        console.log("✅ Accounts synced:", result.data.accounts.length);
      } else {
        setError(result.message || "Failed to sync accounts");
      }
    } catch (err) {
      setError("Failed to sync accounts");
      console.error("Account sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync transactions
  const syncTransactions = async () => {
    if (!accessToken || !userEmail) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, userEmail }),
      });

      const result = await response.json();

      if (result.success) {
        setSyncStatus((prev) => ({ ...prev, transactions: true }));
        console.log("✅ Transactions synced:", result.data);
        await fetchTransactions(); // Refresh the list
      } else {
        setError(result.message || "Failed to sync transactions");
      }
    } catch (err) {
      setError("Failed to sync transactions");
      console.error("Transaction sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(
        `/api/transactions/list?page=1&limit=50&userEmail=${encodeURIComponent(
          userEmail
        )}`
      );

      const result = await response.json();

      if (result.success) {
        setTransactions(result.data.transactions);
      } else {
        setError(result.message || "Failed to fetch transactions");
      }
    } catch (err) {
      setError("Failed to fetch transactions");
      console.error("Transaction fetch error:", err);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!userEmail) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const response = await fetch(
        `/api/analytics?userEmail=${encodeURIComponent(
          userEmail
        )}&month=${currentMonth}&year=${currentYear}`
      );

      const result = await response.json();

      if (result.success) {
        setAnalyticsData(result.data);
        console.log("✅ Analytics data loaded:", result.data);
      } else {
        console.error("Failed to fetch analytics:", result.message);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  // Fetch budget data
  const fetchBudgetData = async () => {
    if (!userEmail) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [summaryResponse, categoriesResponse] = await Promise.all([
        fetch(
          `/api/budget/summary?userEmail=${encodeURIComponent(
            userEmail
          )}&month=${currentMonth}&year=${currentYear}`
        ),
        fetch("/api/budget/categories?includeIncome=false"),
      ]);

      const [summaryResult, categoriesResult] = await Promise.all([
        summaryResponse.json(),
        categoriesResponse.json(),
      ]);

      if (summaryResult.success) {
        setBudgetData(summaryResult.data);
      }

      if (categoriesResult.success) {
        setBudgetCategories(categoriesResult.data.categories);
      }

      console.log("✅ Budget data loaded");
    } catch (err) {
      console.error("Budget fetch error:", err);
    }
  };

  // Initialize budget categories
  const initializeBudgetCategories = async () => {
    try {
      const response = await fetch("/api/budget/categories", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        console.log("✅ Budget categories initialized");
        await fetchBudgetData(); // Refresh data
      }
    } catch (err) {
      console.error("Failed to initialize budget categories:", err);
    }
  };

  // Save budget for a category
  const saveBudget = async (categoryId: string, amount: number) => {
    if (!userEmail || amount < 0) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const response = await fetch("/api/budget/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          categoryId,
          month: currentMonth,
          year: currentYear,
          budgetedAmount: amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Budget saved");
        await fetchBudgetData(); // Refresh data
        await fetchAugustAnalysis(); // Refresh August analysis
      } else {
        setError(result.message || "Failed to save budget");
      }
    } catch (err) {
      console.error("Failed to save budget:", err);
      setError("Failed to save budget");
    }
  };

  // Fetch August analysis
  const fetchAugustAnalysis = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(
        `/api/budget/august?userEmail=${encodeURIComponent(userEmail)}&year=2025`
      );

      const result = await response.json();

      if (result.success) {
        setAugustAnalysis(result.data);
        // Set monthly goal from data if it exists
        if (result.data.monthlyGoal.isSet) {
          setMonthlyGoal(result.data.monthlyGoal.totalBudget);
          setGoalNotes(result.data.monthlyGoal.notes || "");
        }
        console.log("✅ August analysis loaded:", result.data);
      } else {
        console.error("Failed to fetch August analysis:", result.message);
      }
    } catch (err) {
      console.error("August analysis fetch error:", err);
    }
  };

  // Save monthly budget goal
  const saveMonthlyGoal = async () => {
    if (!userEmail || monthlyGoal <= 0) return;

    try {
      const response = await fetch("/api/budget/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          month: 8, // August
          year: 2025,
          totalBudget: monthlyGoal,
          notes: goalNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Monthly goal saved");
        await fetchAugustAnalysis(); // Refresh data
      } else {
        setError(result.message || "Failed to save monthly goal");
      }
    } catch (err) {
      console.error("Failed to save monthly goal:", err);
      setError("Failed to save monthly goal");
    }
  };

  // Auto sync on auth
  useEffect(() => {
    if (isAuthenticated && accessToken && userEmail) {
      syncAccounts();
      fetchAnalytics();
      fetchBudgetData();
      fetchAugustAnalysis();
    }
  }, [isAuthenticated, accessToken, userEmail]);

  // Calculate totals
  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0
  );
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netAmount = totalIncome - totalExpenses;

  // Get real spending data or fallback to loading state
  const spendingCategories = analyticsData?.spendingByCategory || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Personal Budget App
            </h1>
            <p className="text-gray-600">
              Connect your SpareBank1 account to start tracking your finances
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <SpareBank1OAuthSetup onAuthChange={handleAuthChange} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Personal Budget App
              </h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Connected to SpareBank1
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={syncAccounts}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{loading ? "Syncing..." : "Sync Accounts"}</span>
                {syncStatus.accounts && (
                  <span className="text-green-200">✓</span>
                )}
              </button>
              <button
                onClick={syncTransactions}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{loading ? "Syncing..." : "Sync Transactions"}</span>
                {syncStatus.transactions && (
                  <span className="text-green-200">✓</span>
                )}
              </button>
              <button
                onClick={cleanDuplicates}
                disabled={loading}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{loading ? "Cleaning..." : "Clean Duplicates"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 px-4 py-2 border border-red-600 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: "dashboard", label: "Dashboard", icon: "📊" },
              { key: "transactions", label: "Transactions", icon: "💰" },
              { key: "accounts", label: "Accounts", icon: "🏦" },
              { key: "analytics", label: "Analytics", icon: "📈" },
              { key: "budget", label: "Budget", icon: "💵" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() =>
                  setActiveTab(
                    tab.key as
                      | "dashboard"
                      | "transactions"
                      | "accounts"
                      | "analytics"
                      | "budget"
                  )
                }
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">₩</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Balance
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalBalance.toLocaleString("no-NO", {
                        style: "currency",
                        currency: "NOK",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">↗</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Income (90 days)
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      +
                      {totalIncome.toLocaleString("no-NO", {
                        style: "currency",
                        currency: "NOK",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold">↘</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Expenses (90 days)
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      -
                      {totalExpenses.toLocaleString("no-NO", {
                        style: "currency",
                        currency: "NOK",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 ${
                        netAmount >= 0 ? "bg-green-100" : "bg-red-100"
                      } rounded-full flex items-center justify-center`}
                    >
                      <span
                        className={`${
                          netAmount >= 0 ? "text-green-600" : "text-red-600"
                        } font-bold`}
                      >
                        {netAmount >= 0 ? "📈" : "📉"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Net Amount
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        netAmount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {netAmount >= 0 ? "+" : ""}
                      {netAmount.toLocaleString("no-NO", {
                        style: "currency",
                        currency: "NOK",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounts Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Account Balances
                </h3>
              </div>
              <div className="p-6">
                {accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No accounts synced yet</p>
                    <button
                      onClick={syncAccounts}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Sync Your Accounts
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {account.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {account.accountNumber}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {account.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {Number(account.balance).toLocaleString("no-NO", {
                                style: "currency",
                                currency: account.currencyCode,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="p-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No transactions synced yet
                    </p>
                    <button
                      onClick={syncTransactions}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      Sync Your Transactions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString(
                              "no-NO"
                            )}{" "}
                            • {transaction.account?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              transaction.amount >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {transaction?.amount?.toLocaleString("no-NO", {
                              style: "currency",
                              currency: transaction?.currency,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Transaction History
              </h2>
              <p className="text-gray-600">
                View and manage all your financial transactions
              </p>
            </div>
            <TransactionList />
          </div>
        )}

        {activeTab === "accounts" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Account Management
              </h2>
              <p className="text-gray-600">
                Overview of all your connected accounts
              </p>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Connected Accounts ({accounts.length})
                  </h3>
                  <button
                    onClick={syncAccounts}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Syncing..." : "Refresh Accounts"}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-xl">🏦</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No accounts found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Sync your SpareBank1 accounts to get started
                    </p>
                    <button
                      onClick={syncAccounts}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Sync Accounts Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {account.name}
                            </h4>
                            <p className="text-gray-500">
                              {account.accountNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {Number(account.balance).toLocaleString("no-NO", {
                                style: "currency",
                                minimumFractionDigits: 2,
                                currency: account.currencyCode,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Account Type:</span>
                            <span className="text-gray-900">
                              {account.type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Available Balance:
                            </span>
                            <span className="text-gray-900">
                              {Number(account.balance).toLocaleString("no-NO", {
                                style: "currency",
                                currency: account.currencyCode,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Currency:</span>
                            <span className="text-gray-900">
                              {account.currencyCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Financial Analytics
              </h2>
              <p className="text-gray-600">
                Insights into your spending patterns and financial health
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Spending by Category */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Spending by Category (Current Month)
                </h3>
                {!analyticsData ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading analytics...
                  </div>
                ) : spendingCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No spending data available for this month
                  </div>
                ) : (
                  <div className="space-y-4">
                    {spendingCategories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-gray-700">{category.name}</span>
                          <span className="text-gray-400 text-sm ml-2">
                            ({category.transactionCount} transactions)
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {category.amount.toLocaleString("no-NO", {
                            style: "currency",
                            currency: "NOK",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Health Score */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Financial Health
                </h3>
                {!analyticsData ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading health score...
                  </div>
                ) : (
                  <div className="text-center">
                    <div
                      className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
                      style={{
                        backgroundColor:
                          analyticsData.financialHealth.color + "20",
                        color: analyticsData.financialHealth.color,
                      }}
                    >
                      <span className="text-2xl font-bold">
                        {analyticsData.financialHealth.score}
                      </span>
                    </div>
                    <p
                      className="font-semibold mb-2"
                      style={{ color: analyticsData.financialHealth.color }}
                    >
                      {analyticsData.financialHealth.status} Financial Health
                    </p>
                    <div className="text-gray-500 text-sm space-y-1">
                      <p>
                        Income:{" "}
                        {analyticsData.financialHealth.metrics.totalIncome.toLocaleString(
                          "no-NO",
                          { style: "currency", currency: "NOK" }
                        )}
                      </p>
                      <p>
                        Expenses:{" "}
                        {analyticsData.financialHealth.metrics.totalExpenses.toLocaleString(
                          "no-NO",
                          { style: "currency", currency: "NOK" }
                        )}
                      </p>
                      <p>
                        Savings Rate:{" "}
                        {analyticsData.financialHealth.metrics.savingsRate}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Monthly Trends (Last 6 Months)
              </h3>
              {!analyticsData ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading trends...
                </div>
              ) : analyticsData.monthlyTrends &&
                analyticsData.monthlyTrends.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.monthlyTrends.map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-700">
                          {trend.monthName} {trend.year}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <span className="text-green-600">
                          Income:{" "}
                          {trend.income.toLocaleString("no-NO", {
                            style: "currency",
                            currency: "NOK",
                          })}
                        </span>
                        <span className="text-red-600">
                          Expenses:{" "}
                          {trend.expenses.toLocaleString("no-NO", {
                            style: "currency",
                            currency: "NOK",
                          })}
                        </span>
                        <span
                          className={`font-semibold ${
                            trend.net >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          Net:{" "}
                          {trend.net.toLocaleString("no-NO", {
                            style: "currency",
                            currency: "NOK",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No trend data available yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "budget" && (
          <div>
            {/* August Budget Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    🗓️ August 2025 Budget
                  </h2>
                  <p className="text-gray-600">
                    Track your spending goals and progress throughout August
                  </p>
                </div>
                {budgetCategories.length === 0 && (
                  <button
                    onClick={initializeBudgetCategories}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Initialize Categories
                  </button>
                )}
              </div>
              
              {/* August Progress Bar */}
              {augustAnalysis && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">August Progress</span>
                    <span className="text-sm text-blue-700">
                      Day {augustAnalysis.period.daysElapsed} of {augustAnalysis.period.daysInMonth} 
                      ({augustAnalysis.period.daysRemaining} days left)
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${augustAnalysis.period.percentageComplete}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {augustAnalysis.period.percentageComplete.toFixed(1)}% of August completed
                  </p>
                </div>
              )}
            </div>

            {budgetCategories.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 mb-4">No budget categories found</p>
                <button
                  onClick={initializeBudgetCategories}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Setup Budget Categories
                </button>
              </div>
            ) : (
              <>
                {/* Monthly Goal Setting */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    💰 August Budget Goal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Monthly Budget (NOK)
                      </label>
                      <input
                        type="number"
                        value={monthlyGoal}
                        onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                        placeholder="Set your August budget goal"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={goalNotes}
                        onChange={(e) => setGoalNotes(e.target.value)}
                        placeholder="Budget notes or goals..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={saveMonthlyGoal}
                        disabled={monthlyGoal <= 0}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Goal
                      </button>
                    </div>
                  </div>
                </div>

                {/* August Overview Dashboard */}
                {augustAnalysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Current Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Current Status</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Spent So Far</span>
                          <span className="font-bold text-2xl text-red-600">
                            {augustAnalysis.totals.spent.toLocaleString("no-NO", {
                              style: "currency", currency: "NOK"
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Category Budgets Set</span>
                          <span className="font-bold text-2xl text-blue-600">
                            {augustAnalysis.totals.budgeted.toLocaleString("no-NO", {
                              style: "currency", currency: "NOK"
                            })}
                          </span>
                        </div>
                        {augustAnalysis.monthlyGoal.isSet && (
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-gray-600">Monthly Goal</span>
                            <span className="font-bold text-2xl text-green-600">
                              {augustAnalysis.monthlyGoal.totalBudget.toLocaleString("no-NO", {
                                style: "currency", currency: "NOK"
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">August Transactions</span>
                          <span className="font-bold text-lg">{augustAnalysis.transactions.thisMonth}</span>
                        </div>
                      </div>
                    </div>

                    {/* Projections */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">🔮 August Projections</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Daily Average Spent</span>
                          <span className="font-bold text-lg">
                            {augustAnalysis.projections.dailySpentAverage.toLocaleString("no-NO", {
                              style: "currency", currency: "NOK"
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Projected Total Spending</span>
                          <span className={`font-bold text-xl ${
                            augustAnalysis.projections.isProjectedOverBudget ? "text-red-600" : "text-green-600"
                          }`}>
                            {augustAnalysis.projections.projectedTotalSpending.toLocaleString("no-NO", {
                              style: "currency", currency: "NOK"
                            })}
                          </span>
                        </div>
                        {augustAnalysis.projections.isProjectedOverBudget && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-sm">
                              ⚠️ Projected to exceed budget by{" "}
                              {Math.abs(augustAnalysis.projections.projectedOverBudget).toLocaleString("no-NO", {
                                style: "currency", currency: "NOK"
                              })}
                            </p>
                          </div>
                        )}
                        {augustAnalysis.monthlyGoal.isSet && (
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-gray-600">Goal Progress</span>
                            <span className={`font-bold text-lg ${
                              augustAnalysis.monthlyGoal.goalPercentageUsed > 100 ? "text-red-600" : "text-green-600"
                            }`}>
                              {augustAnalysis.monthlyGoal.goalPercentageUsed.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {augustAnalysis && (augustAnalysis.alerts.overBudgetCount > 0 || augustAnalysis.alerts.projectedOverBudgetCount > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Budget Alerts</h4>
                    <div className="text-yellow-700 text-sm space-y-1">
                      {augustAnalysis.alerts.overBudgetCount > 0 && (
                        <p>• {augustAnalysis.alerts.overBudgetCount} categories are currently over budget</p>
                      )}
                      {augustAnalysis.alerts.projectedOverBudgetCount > 0 && (
                        <p>• {augustAnalysis.alerts.projectedOverBudgetCount} categories are projected to exceed their budgets</p>
                      )}
                      {augustAnalysis.alerts.alertCount > 0 && (
                        <p>• {augustAnalysis.alerts.alertCount} categories have reached their alert thresholds</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget Categories with August Data */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    🏷️ August Category Budgets
                  </h3>
                  <div className="space-y-4">
                    {budgetCategories.map((category) => {
                      const categoryData = augustAnalysis?.categories.find(
                        (c) => c.category.id === category.id
                      );
                      return (
                        <div
                          key={category.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{category.icon}</span>
                              <div>
                                <span className="font-medium text-gray-900 block">
                                  {category.name}
                                </span>
                                {categoryData && (
                                  <span className="text-xs text-gray-500">
                                    {categoryData.transactionCount} transactions in August
                                  </span>
                                )}
                              </div>
                            </div>
                            {categoryData && (
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {categoryData.actualSpent.toLocaleString("no-NO", {
                                    style: "currency", currency: "NOK"
                                  })}{" "}/{" "}
                                  {categoryData.budgetedAmount.toLocaleString("no-NO", {
                                    style: "currency", currency: "NOK"
                                  })}
                                </p>
                                <p className={`text-sm font-medium ${
                                  categoryData.isOverBudget ? "text-red-600" : "text-green-600"
                                }`}>
                                  {categoryData.percentageUsed.toFixed(1)}% used
                                </p>
                                {categoryData.isProjectedOverBudget && (
                                  <p className="text-xs text-orange-600">
                                    Projected: {categoryData.projectedTotalSpending.toLocaleString("no-NO", {
                                      style: "currency", currency: "NOK"
                                    })}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {categoryData && (
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-300 ${
                                    categoryData.isOverBudget
                                      ? "bg-red-500"
                                      : categoryData.shouldAlert
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, categoryData.percentageUsed)}%`,
                                  }}
                                ></div>
                              </div>
                              {/* Projection overlay */}
                              {categoryData.isProjectedOverBudget && (
                                <div className="w-full bg-transparent rounded-full h-1 -mt-3 relative">
                                  <div
                                    className="h-1 bg-orange-400 opacity-60 absolute top-0"
                                    style={{
                                      width: `${Math.min(100, (categoryData.projectedTotalSpending / categoryData.budgetedAmount) * 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Budget Input */}
                          <div className="flex items-center space-x-4">
                            <input
                              type="number"
                              placeholder="Set budget amount"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              defaultValue={categoryData?.budgetedAmount || ""}
                              id={`budget-${category.id}`}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(
                                  `budget-${category.id}`
                                ) as HTMLInputElement;
                                const amount = parseFloat(input.value);
                                if (!isNaN(amount) && amount >= 0) {
                                  saveBudget(category.id, amount);
                                }
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
