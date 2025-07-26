import axios, { AxiosInstance } from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type {
  Account,
  Transaction,
  ClassifiedTransaction,
  TransactionDetail,
  TransactionExport,
  CreditCardTransfer,
} from "@/types/sparebank1";

export class SpareBank1Client {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: "https://api.sparebank1.no/personal/banking",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(
          "SpareBank1 API Error:",
          error.response?.data || error.message
        );
        throw error;
      }
    );
  }

  // Account Methods
  async getAccounts(): Promise<Account[]> {
    const response = await this.client.get("/accounts");
    return response.data;
  }

  async getAccountBalance(accountKey: string) {
    const response = await this.client.post("/accounts/balance", {
      accountKey,
    });
    return response.data;
  }

  async getAccountDetails(accountKey: string) {
    const response = await this.client.get(`/accounts/${accountKey}/details`);
    return response.data;
  }

  async getDefaultAccount() {
    const response = await this.client.get("/accounts/default");
    return response.data;
  }

  async getAccountRoles(accountKey: string) {
    const response = await this.client.get(`/accounts/${accountKey}/roles`);
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
    const response = await this.client.get("/transactions", { params });
    return response.data;
  }

  async getClassifiedTransactions(params?: {
    fromDate?: string;
    toDate?: string;
    accountKey?: string;
    page?: number;
    size?: number;
  }): Promise<ClassifiedTransaction[]> {
    const response = await this.client.get("/transactions/classified", {
      params,
    });
    return response.data;
  }

  async getTransactionDetails(
    transactionId: string
  ): Promise<TransactionDetail> {
    const response = await this.client.get(
      `/transactions/${transactionId}/details`
    );
    return response.data;
  }

  async getClassifiedTransactionDetails(transactionId: string) {
    const response = await this.client.get(
      `/transactions/${transactionId}/details/classified`
    );
    return response.data;
  }

  async exportTransactions(params: {
    fromDate: string;
    toDate: string;
    accountKey?: string;
  }): Promise<TransactionExport> {
    const response = await this.client.get("/transactions/export", {
      params,
      responseType: "text",
    });

    return {
      data: response.data,
      filename: `transactions_${params.fromDate}_${params.toDate}.csv`,
      contentType: "text/csv",
    };
  }

  // Credit Card Methods
  async transferToCreditCard(data: CreditCardTransfer) {
    const response = await this.client.post("/creditcard/transferTo", data);
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

// Factory function to create authenticated client
export async function getSpareBank1Client(): Promise<SpareBank1Client> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    throw new Error(
      "No access token available. Please authenticate with SpareBank1."
    );
  }

  return new SpareBank1Client(session.accessToken as string);
}

// Client-side factory (for API routes)
export function createSpareBank1Client(accessToken: string): SpareBank1Client {
  return new SpareBank1Client(accessToken);
}
