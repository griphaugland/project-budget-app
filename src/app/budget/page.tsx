"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getValidAccessTokenSync } from "@/lib/auth-simple";

interface BankAccount {
  accountKey: string;
  name: string;
  type: string;
  balance: {
    amount: number;
    currency: string;
  };
  isDefault: boolean;
}

interface TransactionTestResult {
  success: boolean;
  data?: {
    transactions: {
      success: boolean;
      count: number;
      sample: any[];
      structure: string[];
    };
    classifiedTransactions: {
      success: boolean;
      count: number;
      sample: any[];
      structure: string[];
    };
  };
  message?: string;
}

interface TransactionSyncResult {
  success: boolean;
  data?: {
    summary: {
      accountsSynced: number;
      transactionsSaved: number;
      dateRange: string;
    };
    accounts: {
      total: number;
      synced: number;
    };
    transactions: {
      totalFetched: number;
      totalSaved: number;
    };
  };
  message?: string;
}

export default function BudgetDashboard() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionTest, setTransactionTest] =
    useState<TransactionTestResult | null>(null);
  const [testingTransactions, setTestingTransactions] = useState(false);
  const [transactionSync, setTransactionSync] =
    useState<TransactionSyncResult | null>(null);
  const [syncingTransactions, setSyncingTransactions] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accessToken = getValidAccessTokenSync();
      if (!accessToken) return;

      const response = await fetch("/api/accounts/sync-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const result = await response.json();
      if (result.success && result.data?.sparebank1Test?.accounts) {
        setAccounts(result.data.sparebank1Test.accounts);
      }
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const testTransactionAPIs = async () => {
    try {
      setTestingTransactions(true);
      const accessToken = getValidAccessTokenSync();
      if (!accessToken) return;

      const response = await fetch("/api/test-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const result = await response.json();
      setTransactionTest(result);
    } catch (error) {
      console.error("Failed to test transaction APIs:", error);
    } finally {
      setTestingTransactions(false);
    }
  };

  const syncTransactions = async () => {
    try {
      setSyncingTransactions(true);
      const accessToken = getValidAccessTokenSync();
      if (!accessToken) return;

      const response = await fetch("/api/transactions/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          dateRange: { days: 30 }, // Sync last 30 days
        }),
      });

      const result = await response.json();
      setTransactionSync(result);

      if (result.success) {
        // Reload accounts to get updated data
        await loadAccounts();
      }
    } catch (error) {
      console.error("Failed to sync transactions:", error);
    } finally {
      setSyncingTransactions(false);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce(
      (total, account) => total + account.balance.amount,
      0
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Your Budget Dashboard
        </h2>
        <p className="text-gray-600">
          Your complete financial overview and transaction management
        </p>
      </div>

      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Overview
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading accounts...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">
                  Total Balance
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {getTotalBalance().toLocaleString()} NOK
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Accounts</p>
                <p className="text-2xl font-bold text-green-900">
                  {accounts.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-purple-600">Status</p>
                <p className="text-lg font-semibold text-purple-900">
                  Connected
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Your Accounts</h4>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.accountKey}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {account.name}
                      </p>
                      <p className="text-sm text-gray-600">{account.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {account.balance.amount.toLocaleString()}{" "}
                        {account.balance.currency}
                      </p>
                      {account.isDefault && (
                        <p className="text-xs text-blue-600">Default Account</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Sync */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Management
        </h3>
        <p className="text-gray-600 mb-4">
          Sync your real transaction data from SpareBank1 to start building
          budgets and tracking spending.
        </p>

        <div className="flex space-x-4 mb-4">
          <Button
            onClick={syncTransactions}
            disabled={syncingTransactions}
            className="bg-green-600 hover:bg-green-700"
          >
            {syncingTransactions
              ? "Syncing..."
              : "Sync Transactions (Last 30 Days)"}
          </Button>

          <Button
            onClick={testTransactionAPIs}
            disabled={testingTransactions}
            variant="outline"
          >
            {testingTransactions ? "Testing APIs..." : "Test Transaction APIs"}
          </Button>
        </div>

        {transactionSync && (
          <div className="mt-4 space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">
                {transactionSync.success
                  ? "✅ Sync Successful!"
                  : "❌ Sync Failed"}
              </h4>

              {transactionSync.success && transactionSync.data ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm font-medium text-gray-800">
                        Accounts Synced
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {transactionSync.data.summary.accountsSynced}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm font-medium text-gray-800">
                        Transactions Saved
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {transactionSync.data.summary.transactionsSaved}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm font-medium text-gray-800">
                        Date Range
                      </p>
                      <p className="text-sm text-gray-600">
                        {transactionSync.data.summary.dateRange}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-green-700">
                    <p>
                      ✅ {transactionSync.data.accounts.synced}/
                      {transactionSync.data.accounts.total} accounts synced
                    </p>
                    <p>
                      ✅ {transactionSync.data.transactions.totalSaved}/
                      {transactionSync.data.transactions.totalFetched}{" "}
                      transactions processed
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <p>❌ {transactionSync.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transaction API Testing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Data Testing
        </h3>
        <p className="text-gray-600 mb-4">
          Test the SpareBank1 transaction APIs to understand the data structure
          for building the budget features.
        </p>

        {transactionTest && (
          <div className="mt-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                API Test Results
              </h4>

              {transactionTest.success ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-gray-800">
                        Basic Transactions
                      </h5>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        {transactionTest.data?.transactions.success
                          ? "✅ Success"
                          : "❌ Failed"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Count: {transactionTest.data?.transactions.count || 0}
                      </p>
                      {transactionTest.data?.transactions.structure.length >
                        0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Fields:{" "}
                          {transactionTest.data.transactions.structure.join(
                            ", "
                          )}
                        </p>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-gray-800">
                        Classified Transactions
                      </h5>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        {transactionTest.data?.classifiedTransactions.success
                          ? "✅ Success"
                          : "❌ Failed"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Count:{" "}
                        {transactionTest.data?.classifiedTransactions.count ||
                          0}
                      </p>
                      {transactionTest.data?.classifiedTransactions.structure
                        .length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Fields:{" "}
                          {transactionTest.data.classifiedTransactions.structure.join(
                            ", "
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {transactionTest.data?.transactions.sample.length > 0 && (
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-gray-800 mb-2">
                        Sample Transaction Data
                      </h5>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(
                          transactionTest.data.transactions.sample[0],
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  <p>❌ Test failed: {transactionTest.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          🚀 Next Development Steps
        </h3>
        <div className="space-y-2 text-blue-800">
          <p>
            1. ✅ <strong>Authentication & Accounts:</strong> Complete
          </p>
          <p>
            2. ✅ <strong>Database Schema:</strong> Updated with SpareBank1
            structure
          </p>
          <p>
            3. ✅ <strong>Transaction Sync:</strong> Real data syncing
            implemented
          </p>
          <p>
            4. 🔄 <strong>Transaction Management:</strong> Use the sync button
            above to import your real transactions
          </p>
          <p>
            5. ⏭️ <strong>Transaction List View:</strong> Build transaction list
            and filtering
          </p>
          <p>
            6. ⏭️ <strong>Budget Creation:</strong> Build budget creation and
            tracking features
          </p>
        </div>
      </div>
    </div>
  );
}
