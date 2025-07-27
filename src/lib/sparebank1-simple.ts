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

export class SpareBank1SimpleClient {
  private client: AxiosInstance;
  private accessToken: string;

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

        // Log the full error response for 406 errors
        if (error.response?.status === 406) {
          console.error("406 Error - Full Response:", error.response);
          console.error("406 Error - Request Config:", error.config);
        }

        throw error;
      }
    );

    // Add request interceptor to log outgoing requests
    this.client.interceptors.request.use(
      (config) => {
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
            name: (account as RawSpareBank1Account).name,
            type:
              (account as RawSpareBank1Account).type ||
              (account as RawSpareBank1Account).description,
            balance: {
              amount: (account as RawSpareBank1Account).balance || 0,
              currency: (account as RawSpareBank1Account).currencyCode || "NOK",
            },
            isDefault: (account as RawSpareBank1Account).isDefault || false,
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
              name: account.name,
              type: account.type || account.description,
              balance: {
                amount: account.balance || 0,
                currency: account.currencyCode || "NOK",
              },
              isDefault: account.isDefault || false,
            })
          );
        }

        return response.data || [];
      } catch (error2) {
        console.error("getAccounts failed with alternative headers too");
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
    fromDate?: string;
    toDate?: string;
    accountKey?: string;
    page?: number;
    size?: number;
  }): Promise<Transaction[]> {
    console.log("🔄 Making getTransactions API call with params:", params);

    const response = await this.client.get("/transactions", {
      params,
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "📦 Raw SpareBank1 getTransactions response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  }

  async getClassifiedTransactions(params?: {
    fromDate?: string;
    toDate?: string;
    accountKey?: string;
    page?: number;
    size?: number;
  }): Promise<ClassifiedTransaction[]> {
    console.log(
      "🔄 Making getClassifiedTransactions API call with params:",
      params
    );

    const response = await this.client.get("/transactions/classified", {
      params,
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "📦 Raw SpareBank1 getClassifiedTransactions response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
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
