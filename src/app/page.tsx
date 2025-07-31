"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SpareBank1OAuthSetup } from "@/components/SpareBank1OAuthSetup";
import { isTokenValid } from "@/lib/auth-simple";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on page load
    const checkAuthentication = () => {
      const valid = isTokenValid();
      setIsAuthenticated(valid);
      setIsCheckingAuth(false);

      if (valid) {
        // User is authenticated, redirect to budget app
        console.log("✅ User is authenticated, redirecting to budget app...");
        router.push("/budget");
      }
    };

    checkAuthentication();
  }, [router]);

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (authenticated) {
      // User just authenticated, redirect to budget app
      console.log("✅ Authentication successful, redirecting to budget app...");
      router.push("/budget");
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show budget app redirect message if authenticated (fallback)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to budget app...</p>
        </div>
      </div>
    );
  }

  // Show login interface for unauthenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Personal Budget App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your SpareBank1 account to get started
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <SpareBank1OAuthSetup onAuthChange={handleAuthChange} />
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-gray-50 px-6 text-gray-900">Features</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">
                      💰
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Real-time Balances
                  </p>
                  <p className="text-xs text-gray-500">Live account data</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-semibold">
                      📊
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Transaction Tracking
                  </p>
                  <p className="text-xs text-gray-500">Categorize & analyze</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-semibold">
                      🎯
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Budget Planning
                  </p>
                  <p className="text-xs text-gray-500">Set & track goals</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-semibold">
                      🔒
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Secure Banking
                  </p>
                  <p className="text-xs text-gray-500">SpareBank1 OAuth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
