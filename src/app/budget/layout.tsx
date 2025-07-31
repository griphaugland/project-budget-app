"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isTokenValid, getSpareBank1Auth } from "@/lib/auth-simple";
import type { SpareBank1Auth } from "@/lib/auth-simple";

interface BudgetLayoutProps {
  children: React.ReactNode;
}

export default function BudgetLayout({ children }: BudgetLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authInfo, setAuthInfo] = useState<SpareBank1Auth | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const auth = getSpareBank1Auth();
      const valid = isTokenValid();

      setAuthInfo(auth);
      setIsAuthenticated(valid);
      setIsLoading(false);

      if (!valid) {
        console.log("❌ Not authenticated, redirecting to login...");
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("sparebank1_auth");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your budget app...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Personal Budget App
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a
                href="/budget"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                href="/budget/transactions"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Transactions
              </a>
              <a
                href="/budget/budgets"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Budgets
              </a>
              <a
                href="/budget/accounts"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Accounts
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Connected to SpareBank1
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
