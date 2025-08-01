import axios, { AxiosInstance } from "axios";
import { getValidAccessToken } from "./auth-simple";
import type {
  Account,
  Transaction,
  ClassifiedTransaction,
  TransactionDetail,
  TransactionExport,
  CreditCardTransfer,
} from "@/types/sparebank1";

// Raw SpareBank1 API response types
interface RawSpareBank1Account {
  key: string;
  accountNumber: string;
  iban: string;
  name: string;
  description: string;
  balance: number;
  availableBalance: number;
  currencyCode: string;
  owner: Record<string, unknown>;
  productType: string;
  type: string;
  productId: string;
  descriptionCode: string;
  disposalRole: boolean;
  isDefault?: boolean;
  accountProperties: Record<string, unknown>;
}

// SpareBank1 API query parameters interface
interface TransactionQueryParams {
  accountKey?: string[];
  fromDate?: string;
  toDate?: string;
  rowLimit?: number;
  source?: string;
  enrichWithPaymentDetails?: boolean;
  enrichWithMerchantLogo?: boolean;
}

export class SpareBank1SimpleClient {
  private client: AxiosInstance;
  private accessToken: string;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 3000; // 3 seconds between requests (more conservative)

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: "https://api.sparebank1.no/personal/banking",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "SpareBank1-Budget-App/1.0.0",
        // Remove Content-Type for GET requests - it's not needed and may cause 406
      },
      timeout: 30000, // 30 second timeout
    });

    // Add response interceptor for detailed error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log("✅ SpareBank1 API Response:", {
          status: response.status,
          statusText: response.statusText,
          url: response.config?.url,
          method: response.config?.method,
          dataType: typeof response.data,
          dataKeys:
            typeof response.data === "object"
              ? Object.keys(response.data)
              : "not-object",
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error("SpareBank1 API Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          requestHeaders: error.config?.headers,
          message: error.message,
        });

        // Handle rate limiting (429 errors)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers["retry-after"];
          const rateLimitRemaining =
            error.response.headers["x-ratelimit-remaining"];
          console.error("🚨 Rate Limited (429):", {
            retryAfter,
            rateLimitRemaining,
            message: "Too many requests - API rate limit exceeded",
            suggestion: "Wait 30-60 minutes before trying again",
          });

          // Add rate limit info to error for handling upstream
          error.isRateLimit = true;
          error.retryAfter = retryAfter;
          error.rateLimitMessage =
            "SpareBank1 API rate limit exceeded. Please wait 30-60 minutes before retrying.";
        }

        // Log the full error response for 406 errors
        if (error.response?.status === 406) {
          console.error("406 Error - Full Response:", error.response);
          console.error("406 Error - Request Config:", error.config);
        }

        throw error;
      }
    );

    // Add request interceptor to log outgoing requests and handle rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting: ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minRequestInterval) {
          const delay = this.minRequestInterval - timeSinceLastRequest;
          console.log(`⏳ Rate limiting: waiting ${delay}ms before API call`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        this.lastRequestTime = Date.now();

        console.log("SpareBank1 API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        console.error("Request setup error:", error);
        return Promise.reject(error);
      }
    );
  }

  // Rate limiting helper method
  private async waitForRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter ? retryAfter * 1000 : 5000; // Default 5 seconds
    console.log(
      `🛑 Rate limited - waiting ${delay / 1000} seconds before retry`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Account Methods
  async getAccounts(): Promise<Account[]> {
    try {
      console.log("🔄 Making getAccounts API call...");

      // Try with minimal headers first
      const response = await this.client.get("/accounts", {
        headers: {
          Accept: "application/json",
          // Don't include Content-Type for GET requests
        },
      });

      console.log(
        "📦 Raw SpareBank1 getAccounts response:",
        JSON.stringify(response.data, null, 2)
      );

      // Handle the actual response structure from SpareBank1
      if (response.data && typeof response.data === "object") {
        if (Array.isArray(response.data)) {
          console.log("✅ Response is an array, returning directly");
          return response.data;
        } else if (
          response.data.accounts &&
          Array.isArray(response.data.accounts)
        ) {
          console.log(
            "✅ Response has accounts array, returning accounts property"
          );
          return response.data.accounts.map((account: unknown) => ({
            accountKey: (account as RawSpareBank1Account).key,
            accountNumber: (account as RawSpareBank1Account).accountNumber,
            iban: (account as RawSpareBank1Account).iban,
            name: (account as RawSpareBank1Account).name,
            description: (account as RawSpareBank1Account).description,
            balance: (account as RawSpareBank1Account).balance || 0,
            availableBalance:
              (account as RawSpareBank1Account).availableBalance || 0,
            currencyCode:
              (account as RawSpareBank1Account).currencyCode || "NOK",
            type: (account as RawSpareBank1Account).type,
            productType: (account as RawSpareBank1Account).productType,
            productId: (account as RawSpareBank1Account).productId,
            descriptionCode: (account as RawSpareBank1Account).descriptionCode,
            disposalRole: (account as RawSpareBank1Account).disposalRole,
            isDefault: (account as RawSpareBank1Account).isDefault || false,
            owner: (account as RawSpareBank1Account).owner,
            accountProperties: (account as RawSpareBank1Account)
              .accountProperties,
          }));
        } else {
          console.warn("⚠️ Unexpected response structure:", response.data);
          return [];
        }
      }

      return response.data || [];
    } catch (error) {
      console.error("getAccounts failed, trying alternative headers...");

      // Try with different Accept header
      try {
        const response = await this.client.get("/accounts", {
          headers: {
            Accept: "*/*",
          },
        });

        console.log(
          "📦 Alternative headers response:",
          JSON.stringify(response.data, null, 2)
        );

        // Same structure handling for fallback
        if (
          response.data &&
          response.data.accounts &&
          Array.isArray(response.data.accounts)
        ) {
          return response.data.accounts.map(
            (account: RawSpareBank1Account) => ({
              accountKey: account.key,
              accountNumber: account.accountNumber,
              iban: account.iban,
              name: account.name,
              description: account.description,
              balance: account.balance || 0,
              availableBalance: account.availableBalance || 0,
              currencyCode: account.currencyCode || "NOK",
              type: account.type,
              productType: account.productType,
              productId: account.productId,
              descriptionCode: account.descriptionCode,
              disposalRole: account.disposalRole,
              isDefault: account.isDefault || false,
              owner: account.owner,
              accountProperties: account.accountProperties,
            })
          );
        }

        return response.data || [];
      } catch (fallbackError) {
        console.error(
          "getAccounts failed with alternative headers too:",
          fallbackError
        );
        throw error; // Throw the original error
      }
    }
  }

  async getAccountBalance(accountKey: string) {
    console.log("🔄 Making getAccountBalance API call for:", accountKey);

    const response = await this.client.post(
      "/accounts/balance",
      {
        accountKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log(
      "📦 Raw SpareBank1 getAccountBalance response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  async getAccountDetails(accountKey: string) {
    console.log("🔄 Making getAccountDetails API call for:", accountKey);

    const response = await this.client.get(`/accounts/${accountKey}/details`, {
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "📦 Raw SpareBank1 getAccountDetails response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  async getDefaultAccount() {
    console.log("🔄 Making getDefaultAccount API call...");

    const response = await this.client.get("/accounts/default", {
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "📦 Raw SpareBank1 getDefaultAccount response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  async getAccountRoles(accountKey: string) {
    console.log("🔄 Making getAccountRoles API call for:", accountKey);

    const response = await this.client.get(`/accounts/${accountKey}/roles`, {
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "📦 Raw SpareBank1 getAccountRoles response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  // Transaction Methods
  async getTransactions(params?: {
    accountKey?: string | string[]; // Can be single account or array of accounts
    fromDate?: string; // yyyy-MM-dd format
    toDate?: string; // yyyy-MM-dd format
    rowLimit?: number; // Maximum number of transactions
    source?: "RECENT" | "HISTORIC" | "ALL"; // Transaction source
    enrichWithPaymentDetails?: boolean;
    enrichWithMerchantLogo?: boolean;
  }): Promise<Transaction[]> {
    console.log("🔄 Making getTransactions API call with params:", params);

    // Prepare query parameters according to SpareBank1 API spec
    const queryParams: TransactionQueryParams = {};

    if (params?.accountKey) {
      // Handle both single account and array of accounts
      queryParams.accountKey = Array.isArray(params.accountKey)
        ? params.accountKey
        : [params.accountKey];
    }

    if (params?.fromDate) queryParams.fromDate = params.fromDate;
    if (params?.toDate) queryParams.toDate = params.toDate;
    if (params?.rowLimit) queryParams.rowLimit = params.rowLimit;
    if (params?.source) queryParams.source = params.source;
    if (params?.enrichWithPaymentDetails)
      queryParams.enrichWithPaymentDetails = params.enrichWithPaymentDetails;
    if (params?.enrichWithMerchantLogo)
      queryParams.enrichWithMerchantLogo = params.enrichWithMerchantLogo;

    try {
      const response = await this.client.get("/transactions", {
        params: queryParams,
        headers: {
          Accept: "application/vnd.sparebank1.v1+json; charset=utf-8",
          "Content-Type": "application/vnd.sparebank1.v1+json; charset=utf-8",
        },
        paramsSerializer: {
          indexes: null, // This changes accountKey[] to accountKey format
        },
      });

      console.log(
        "📦 Raw SpareBank1 getTransactions response:",
        JSON.stringify(response.data, null, 2)
      );

      // Handle SpareBank1 API response structure: array of objects with transactions property
      if (Array.isArray(response.data)) {
        // Flatten all transactions from all accounts
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
          `📦 Processed ${allTransactions.length} transactions from ${response.data.length} account(s)`
        );
        return allTransactions;
      } else if (
        response.data &&
        response.data.transactions &&
        Array.isArray(response.data.transactions)
      ) {
        return response.data.transactions;
      }

      return [];
    } catch (error) {
      console.error("❌ getTransactions failed:", error);

      // Log the actual API error details
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: unknown;
            headers?: unknown;
          };
        };
        console.error("🔍 API Error Details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: JSON.stringify(axiosError.response?.data, null, 2),
          rateLimitRemaining: (
            axiosError.response?.headers as Record<string, string>
          )?.["x-ratelimit-remaining"],
        });
      }

      console.error("🔄 Trying alternative headers...");

      // Try with standard JSON header as fallback
      try {
        const response = await this.client.get("/transactions", {
          params: queryParams,
          headers: {
            Accept: "application/json",
          },
          paramsSerializer: {
            indexes: null, // This changes accountKey[] to accountKey format
          },
        });

        console.log(
          "📦 Alternative headers getTransactions response:",
          JSON.stringify(response.data, null, 2)
        );

        // Handle SpareBank1 API response structure for fallback
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
            `📦 Fallback: Processed ${allTransactions.length} transactions from ${response.data.length} account(s)`
          );
          return allTransactions;
        } else if (
          response.data &&
          response.data.transactions &&
          Array.isArray(response.data.transactions)
        ) {
          return response.data.transactions;
        }

        return [];
      } catch (fallbackError) {
        console.error("❌ getTransactions fallback failed:", fallbackError);

        // Log the actual fallback API error details
        if (fallbackError instanceof Error && "response" in fallbackError) {
          const axiosError = fallbackError as {
            response?: {
              status?: number;
              statusText?: string;
              data?: unknown;
              headers?: unknown;
            };
          };
          console.error("🔍 Fallback API Error Details:", {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: JSON.stringify(axiosError.response?.data, null, 2),
            rateLimitRemaining: (
              axiosError.response?.headers as Record<string, string>
            )?.["x-ratelimit-remaining"],
          });
        }

        throw error; // Throw the original error
      }
    }
  }

  async getClassifiedTransactions(params?: {
    accountKey?: string | string[]; // Can be single account or array of accounts
    fromDate?: string; // yyyy-MM-dd format
    toDate?: string; // yyyy-MM-dd format
    rowLimit?: number; // Maximum number of transactions
    source?: "RECENT" | "HISTORIC" | "ALL"; // Transaction source
    enrichWithPaymentDetails?: boolean;
    enrichWithMerchantLogo?: boolean;
  }): Promise<ClassifiedTransaction[]> {
    console.log(
      "🔄 Making getClassifiedTransactions API call with params:",
      params
    );

    // Prepare query parameters according to SpareBank1 API spec
    const queryParams: TransactionQueryParams = {};

    if (params?.accountKey) {
      queryParams.accountKey = Array.isArray(params.accountKey)
        ? params.accountKey
        : [params.accountKey];
    }

    if (params?.fromDate) queryParams.fromDate = params.fromDate;
    if (params?.toDate) queryParams.toDate = params.toDate;
    if (params?.rowLimit) queryParams.rowLimit = params.rowLimit;
    if (params?.source) queryParams.source = params.source;
    if (params?.enrichWithPaymentDetails)
      queryParams.enrichWithPaymentDetails = params.enrichWithPaymentDetails;
    if (params?.enrichWithMerchantLogo)
      queryParams.enrichWithMerchantLogo = params.enrichWithMerchantLogo;

    try {
      const response = await this.client.get("/transactions/classified", {
        params: queryParams,
        headers: {
          Accept: "application/vnd.sparebank1.v1+json; charset=utf-8",
        },
        paramsSerializer: {
          indexes: null, // This changes accountKey[] to accountKey format
        },
      });

      console.log(
        "📦 Raw SpareBank1 getClassifiedTransactions response:",
        JSON.stringify(response.data, null, 2)
      );

      // Handle SpareBank1 API response structure
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
        return allTransactions;
      }

      // Handle single object response with transactions array
      if (
        response.data &&
        response.data.transactions &&
        Array.isArray(response.data.transactions)
      ) {
        return response.data.transactions;
      }

      return response.data || [];
    } catch (error) {
      console.error("❌ getClassifiedTransactions failed:", error);

      // Log the actual API error details
      if (error instanceof Error && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: unknown;
            headers?: unknown;
          };
        };
        console.error("🔍 Classified API Error Details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: JSON.stringify(axiosError.response?.data, null, 2),
          rateLimitRemaining: (
            axiosError.response?.headers as Record<string, string>
          )?.["x-ratelimit-remaining"],
        });
      }

      console.error("🔄 Trying alternative headers...");

      try {
        const response = await this.client.get("/transactions/classified", {
          params: queryParams,
          headers: {
            Accept: "application/json",
          },
          paramsSerializer: {
            indexes: null, // This changes accountKey[] to accountKey format
          },
        });

        console.log(
          "📦 Alternative headers getClassifiedTransactions response:",
          JSON.stringify(response.data, null, 2)
        );

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
          return allTransactions;
        }

        // Handle single object response with transactions array
        if (
          response.data &&
          response.data.transactions &&
          Array.isArray(response.data.transactions)
        ) {
          return response.data.transactions;
        }

        return response.data || [];
      } catch (fallbackError) {
        console.error(
          "❌ getClassifiedTransactions fallback failed:",
          fallbackError
        );

        // Log the actual fallback API error details
        if (fallbackError instanceof Error && "response" in fallbackError) {
          const axiosError = fallbackError as {
            response?: {
              status?: number;
              statusText?: string;
              data?: unknown;
              headers?: unknown;
            };
          };
          console.error("🔍 Classified Fallback API Error Details:", {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: JSON.stringify(axiosError.response?.data, null, 2),
            rateLimitRemaining: (
              axiosError.response?.headers as Record<string, string>
            )?.["x-ratelimit-remaining"],
          });
        }

        throw error;
      }
    }
  }

  async getTransactionExport(params?: {
    accountKey?: string | string[]; // Can be single account or array of accounts
    fromDate?: string; // yyyy-MM-dd format
    toDate?: string; // yyyy-MM-dd format
    rowLimit?: number; // Maximum number of transactions
    source?: "RECENT" | "HISTORIC" | "ALL"; // Transaction source
    enrichWithPaymentDetails?: boolean;
  }): Promise<string> {
    console.log("🔄 Making getTransactionExport API call with params:", params);

    // Prepare query parameters according to SpareBank1 API spec
    const queryParams: TransactionQueryParams = {};

    if (params?.accountKey) {
      queryParams.accountKey = Array.isArray(params.accountKey)
        ? params.accountKey
        : [params.accountKey];
    }

    if (params?.fromDate) queryParams.fromDate = params.fromDate;
    if (params?.toDate) queryParams.toDate = params.toDate;
    if (params?.rowLimit) queryParams.rowLimit = params.rowLimit;
    if (params?.source) queryParams.source = params.source;
    if (params?.enrichWithPaymentDetails)
      queryParams.enrichWithPaymentDetails = params.enrichWithPaymentDetails;

    try {
      const response = await this.client.get("/transactions/export", {
        params: queryParams,
        headers: {
          Accept: "text/csv",
        },
      });

      console.log(
        "📦 Raw SpareBank1 getTransactionExport response (CSV):",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "getTransactionExport failed, trying alternative headers..."
      );

      try {
        const response = await this.client.get("/transactions/export", {
          params: queryParams,
          headers: {
            Accept: "*/*",
          },
        });

        return response.data;
      } catch (fallbackError) {
        console.error(
          "getTransactionExport failed with alternative headers too:",
          fallbackError
        );
        throw error;
      }
    }
  }

  async getTransactionDetails(
    transactionId: string
  ): Promise<TransactionDetail> {
    console.log("🔄 Making getTransactionDetails API call for:", transactionId);

    const response = await this.client.get(
      `/transactions/${transactionId}/details`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    console.log(
      "📦 Raw SpareBank1 getTransactionDetails response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  async getClassifiedTransactionDetails(transactionId: string) {
    console.log(
      "🔄 Making getClassifiedTransactionDetails API call for:",
      transactionId
    );

    const response = await this.client.get(
      `/transactions/${transactionId}/details/classified`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    console.log(
      "📦 Raw SpareBank1 getClassifiedTransactionDetails response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  async exportTransactions(params: {
    fromDate: string;
    toDate: string;
    accountKey?: string;
  }): Promise<TransactionExport> {
    console.log("🔄 Making exportTransactions API call with params:", params);

    const response = await this.client.get("/transactions/export", {
      params,
      responseType: "text",
      headers: {
        Accept: "text/csv",
      },
    });

    console.log(
      "📦 Raw SpareBank1 exportTransactions response (length):",
      response.data?.length
    );

    return {
      data: response.data,
      filename: `transactions_${params.fromDate}_${params.toDate}.csv`,
      contentType: "text/csv",
    };
  }

  // Credit Card Methods
  async transferToCreditCard(data: CreditCardTransfer) {
    console.log("🔄 Making transferToCreditCard API call with data:", data);

    const response = await this.client.post("/creditcard/transferTo", data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log(
      "📦 Raw SpareBank1 transferToCreditCard response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error("SpareBank1 connection test failed:", error);
      return false;
    }
  }
}

// Factory function to create authenticated client with auto-refresh
export async function createSpareBank1SimpleClient(): Promise<SpareBank1SimpleClient | null> {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    console.warn("No valid SpareBank1 access token available");
    return null;
  }

  return new SpareBank1SimpleClient(accessToken);
}

// Helper function for API routes
export function getSpareBank1ClientFromToken(
  accessToken: string
): SpareBank1SimpleClient {
  return new SpareBank1SimpleClient(accessToken);
}
