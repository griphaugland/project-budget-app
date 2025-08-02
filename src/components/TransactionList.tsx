"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface Transaction {
  id: string;
  sparebank1_id: string;
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
  isConfidential: boolean;
  remoteAccountName: string | null;
  remoteAccountNumber: string | null;
  merchant: Record<string, unknown>;
  classificationInput: Record<string, unknown>;
  created_at: string;
  synced_at: string | null;
}

interface TransactionListData {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    totalAmount: number;
    incomeCount: number;
    expenseCount: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
  };
  filters: {
    search: string | null;
    fromDate: string | null;
    toDate: string | null;
    accountId: string | null;
    categoryId: string | null;
    isIncome: string | null;
  };
}

interface TransactionListProps {
  className?: string;
}

export default function TransactionList({
  className = "",
}: TransactionListProps) {
  const [data, setData] = useState<TransactionListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        userEmail: "user@example.com", // Add user email for new API
      });

      if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      console.log(
        "📊 Fetching transactions with params:",
        Object.fromEntries(params)
      );

      const response = await fetch(`/api/transactions/list?${params}`);
      const result = await response.json();

      if (result.success) {
        // Transform the data to match expected format
        const transformedData = {
          transactions: result.data.transactions,
          pagination: {
            currentPage: result.data.pagination.page,
            totalPages: Math.ceil(
              result.data.pagination.total / result.data.pagination.limit
            ),
            totalCount: result.data.pagination.total,
            limit: result.data.pagination.limit,
            hasNextPage: result.data.pagination.hasMore,
            hasPreviousPage: result.data.pagination.page > 1,
          },
          summary: {
            totalAmount: result.data.transactions.reduce(
              (sum: number, t: Transaction) => sum + t.amount,
              0
            ),
            incomeCount: result.data.transactions.filter(
              (t: Transaction) => t.amount > 0
            ).length,
            expenseCount: result.data.transactions.filter(
              (t: Transaction) => t.amount < 0
            ).length,
            totalIncome: result.data.transactions
              .filter((t: Transaction) => t.amount > 0)
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            totalExpenses: Math.abs(
              result.data.transactions
                .filter((t: Transaction) => t.amount < 0)
                .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
            ),
            netAmount: result.data.transactions.reduce(
              (sum: number, t: Transaction) => sum + t.amount,
              0
            ),
          },
          filters: {
            search: search || null,
            fromDate: fromDate || null,
            toDate: toDate || null,
            accountId: null,
            categoryId: null,
            isIncome: null,
          },
        };

        setData(transformedData);
        setCurrentPage(page);
        console.log(
          `✅ Loaded ${result.data.transactions.length} transactions`
        );
      } else {
        throw new Error(result.message || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error("❌ Failed to fetch transactions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions(1);
  };

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);

    // Fetch without filters
    const params = new URLSearchParams({
      page: "1",
      limit: "20",
      userEmail: "user@example.com",
    });

    fetch(`/api/transactions/list?${params}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
          setCurrentPage(1);
        }
      });
  };

  const formatAmount = (amount: number, currency: string) => {
    const isIncome = amount >= 0;
    const formatted = Math.abs(amount).toLocaleString("nb-NO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const sign = isIncome ? "+" : "-";
    const colorClass = isIncome ? "text-green-600" : "text-red-600";

    return (
      <span className={`font-semibold ${colorClass}`}>
        {sign}
        {formatted} {currency}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !data) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <Button onClick={() => fetchTransactions()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          No transaction data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Transaction History
          </h3>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="text-sm"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-blue-600">
              Total Transactions
            </p>
            <p className="text-lg font-bold text-blue-900">
              {data.pagination.totalCount}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-green-600">Income</p>
            <p className="text-lg font-bold text-green-900">
              +{data.summary.totalIncome.toLocaleString()} NOK
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-red-600">Expenses</p>
            <p className="text-lg font-bold text-red-900">
              -{data.summary.totalExpenses.toLocaleString()} NOK
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-purple-600">Net Amount</p>
            <p
              className={`text-lg font-bold ${
                data.summary.netAmount >= 0 ? "text-green-900" : "text-red-900"
              }`}
            >
              {data.summary.netAmount >= 0 ? "+" : ""}
              {data.summary.netAmount.toLocaleString()} NOK
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search description or merchant..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
              <Button onClick={resetFilters} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {data.transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found for the selected criteria
          </div>
        ) : (
          data.transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {transaction?.description}
                      </p>
                      {transaction?.remoteAccountName && (
                        <p className="text-sm text-gray-600">
                          {transaction?.remoteAccountName}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction?.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction?.account?.name ||
                            transaction?.accountName}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {transaction?.typeCode}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction?.bookingStatus === "BOOKED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {transaction?.bookingStatus}
                        </span>
                        {transaction?.source && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction?.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {formatAmount(transaction?.amount, transaction?.currency)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              {(data.pagination.currentPage - 1) * data.pagination.limit + 1} to{" "}
              {Math.min(
                data.pagination.currentPage * data.pagination.limit,
                data.pagination.totalCount
              )}{" "}
              of {data.pagination.totalCount} transactions
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() =>
                  handlePageChange(data.pagination.currentPage - 1)
                }
                disabled={!data.pagination.hasPreviousPage}
                variant="outline"
                className="text-sm"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {data.pagination.currentPage} of{" "}
                {data.pagination.totalPages}
              </span>
              <Button
                onClick={() =>
                  handlePageChange(data.pagination.currentPage + 1)
                }
                disabled={!data.pagination.hasNextPage}
                variant="outline"
                className="text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
