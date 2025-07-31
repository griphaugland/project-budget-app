// SpareBank1 API Response Types

export interface Account {
  accountKey: string;
  name: string;
  type: string;
  balance: {
    amount: number;
    currency: string;
  };
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  accountKey: string;
  amount: number;
  currency: string;
  description: string;
  merchant?: {
    name: string;
    category?: string;
  };
  date: string;
  classification?: {
    category: string;
    subcategory?: string;
  };
}

export interface ClassifiedTransaction extends Transaction {
  classification: {
    category: string;
    subcategory?: string;
    confidence: number;
  };
}

export interface TransactionDetail {
  id: string;
  amount: number;
  currency: string;
  description: string;
  merchant?: {
    name: string;
    category?: string;
    location?: string;
  };
  date: string;
  accountKey: string;
  reference?: string;
  remittanceInfo?: string;
}

export interface TransactionExport {
  data: string; // CSV data
  filename: string;
  contentType: string;
}

export interface CreditCardTransfer {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency?: string;
  reference?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    hasMore: boolean;
  };
}
