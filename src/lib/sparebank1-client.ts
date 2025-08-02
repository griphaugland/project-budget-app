import axios, { AxiosInstance } from "axios";
import type { Account, Transaction } from "@/types/sparebank1";

/**
 * SpareBank1Client - ONLY handles API communication with SpareBank1
 * No database logic, no mapping, no transformations
 * Returns data exactly as SpareBank1 API provides it
 */
export class SpareBank1Client {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: "https://api.sparebank1.no/personal/banking",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Add request/response interceptors for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🔗 SpareBank1 API Request: ${config.method?.toUpperCase()} ${
            config.baseURL
          }${config.url}`
        );
        console.log(`🔑 Authorization: Bearer ${accessToken.slice(0, 20)}...`);
        return config;
      },
      (error) => {
        console.error("❌ Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ SpareBank1 API Response: ${response.status} ${response.statusText}`
        );
        return response;
      },
      (error) => {
        console.error(
          `❌ SpareBank1 API Error: ${error.response?.status} ${error.response?.statusText}`
        );
        console.error(`❌ Response data:`, error.response?.data);
        console.error(`❌ Request URL:`, error.config?.url);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get accounts from SpareBank1 API
   * Returns raw Account objects exactly as SpareBank1 provides them
   */
  async getAccounts(): Promise<Account[]> {
    console.log("🔄 SpareBank1Client: Fetching accounts...");

    // Use the correct SpareBank1 API endpoint
    const endpoints = [
      "/accounts", // Correct endpoint: /personal/banking/accounts
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await this.client.get(endpoint, {
          headers: {
            Accept: "application/vnd.sparebank1.v1+json; charset=utf-8",
          },
        });

        console.log(
          "📦 SpareBank1 accounts response:",
          JSON.stringify(response.data, null, 2)
        );

        // Handle response structure - return as-is
        if (Array.isArray(response.data)) {
          console.log(`✅ Found accounts at endpoint: ${endpoint}`);
          return response.data;
        }

        if (response.data?.accounts && Array.isArray(response.data.accounts)) {
          console.log(`✅ Found accounts at endpoint: ${endpoint} (nested)`);
          return response.data.accounts;
        }

        console.log(`⚠️ Endpoint ${endpoint} returned unexpected structure`);
      } catch (error: any) {
        console.log(
          `❌ Endpoint ${endpoint} failed: ${error.response?.status} ${error.response?.statusText}`
        );
        if (error.response?.status !== 404) {
          // If it's not a 404, this might be the right endpoint but with a different error
          console.error(
            "❌ Non-404 error, might be the right endpoint:",
            error
          );
          throw new Error(
            `Failed to fetch accounts from ${endpoint}: ${error.message}`
          );
        }
        // Continue to next endpoint if 404
      }
    }

    throw new Error(
      "Failed to find working accounts endpoint. All endpoints returned 404."
    );
  }

  /**
   * Get transactions from SpareBank1 API
   * Returns raw Transaction objects exactly as SpareBank1 provides them
   */
  async getTransactions(params?: {
    accountKey?: string | string[];
    fromDate?: string; // yyyy-MM-dd
    toDate?: string; // yyyy-MM-dd
    rowLimit?: number;
    source?: "RECENT" | "HISTORIC" | "ALL";
  }): Promise<Transaction[]> {
    try {
      console.log("🔄 SpareBank1Client: Fetching transactions...", params);

      // Build query parameters exactly as SpareBank1 expects
      const queryParams: Record<string, any> = {};

      if (params?.accountKey) {
        queryParams.accountKey = Array.isArray(params.accountKey)
          ? params.accountKey
          : [params.accountKey];
      }

      if (params?.fromDate) queryParams.fromDate = params.fromDate;
      if (params?.toDate) queryParams.toDate = params.toDate;
      if (params?.rowLimit) queryParams.rowLimit = params.rowLimit;
      if (params?.source) queryParams.source = params.source;

      const response = await this.client.get("/transactions", {
        params: queryParams,
        headers: {
          Accept: "application/vnd.sparebank1.v1+json; charset=utf-8",
        },
        paramsSerializer: {
          indexes: null, // accountKey[] -> accountKey format
        },
      });

      console.log(
        "📦 SpareBank1 transactions response:",
        JSON.stringify(response.data, null, 2)
      );

      // Handle SpareBank1 response structure - flatten transactions
      if (Array.isArray(response.data)) {
        const allTransactions = response.data.reduce((acc, accountData) => {
          if (
            accountData.transactions &&
            Array.isArray(accountData.transactions)
          ) {
            return acc.concat(accountData.transactions);
          }
          return acc;
        }, []);

        console.log(
          `📦 SpareBank1Client: Processed ${allTransactions.length} transactions`
        );
        return allTransactions;
      }

      if (
        response.data?.transactions &&
        Array.isArray(response.data.transactions)
      ) {
        return response.data.transactions;
      }

      return [];
    } catch (error) {
      console.error(
        "❌ SpareBank1Client: Failed to fetch transactions:",
        error
      );
      throw new Error(`Failed to fetch transactions: ${error}`);
    }
  }

  /**
   * Check if access token is valid by making a simple API call
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.client.get("/accounts");
      return true;
    } catch (error) {
      console.log("🔍 SpareBank1Client: Token validation failed");
      return false;
    }
  }
}
