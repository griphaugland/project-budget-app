// SpareBank1 API Response Types

export interface Account {
  key: string; // SpareBank1 API uses "key", not "accountKey"
  accountNumber: string;
  iban: string;
  name: string;
  description: string;
  balance: number;
  availableBalance: number;
  currencyCode: string;
  type: string;
  productType: string;
  productId: string;
  descriptionCode: string;
  disposalRole: boolean;
  owner: {
    name: string;
    firstName: string;
    lastName: string;
    age: number;
    customerKey: string;
    ssnKey: string;
  };
  accountProperties: {
    isTransferFromEnabled: boolean;
    isTransferToEnabled: boolean;
    isPaymentFromEnabled: boolean;
    isAllowedInAvtaleGiro: boolean;
    hasAccess: boolean;
    isBalancePreferred: boolean;
    isFlexiLoan: boolean;
    isCodebitorLoan: boolean;
    isSecurityBalance: boolean;
    isAksjesparekonto: boolean;
    isSavingsAccount: boolean;
    isBonusAccount: boolean;
    userHasRightOfDisposal: boolean;
    userHasRightOfAccess: boolean;
    isOwned: boolean;
    isWithdrawalsAllowed: boolean;
    isBlocked: boolean;
    isHidden: boolean;
    isBalanceUpdatedImmediatelyOnTransferTo: boolean;
    isDefaultPaymentAccount: boolean;
  };
}

export interface Transaction {
  id: string;
  nonUniqueId?: string;
  description?: string;
  cleanedDescription?: string;
  accountNumber: {
    value: string;
    formatted: string;
    unformatted: string;
  };
  remoteAccountNumber?: string;
  remoteAccountName?: string;
  amount: number;
  date: number; // Unix timestamp
  typeCode: string;
  currencyCode: string;
  canShowDetails: boolean;
  source: "RECENT" | "HISTORIC";
  isConfidential: boolean;
  bookingStatus: "PENDING" | "BOOKED";
  accountName: string;
  accountKey: string;
  accountCurrency: string;
  isFromCurrencyAccount: boolean;
  kidOrMessage?: string;
  classificationInput?: {
    id: string;
    amount: number;
    type: string;
    text?: string;
    date: string;
  };
  merchant?: {
    id: string;
    img?: string;
    name: string;
    address?: string;
    country?: string;
    logoImg?: string;
    postcode?: string;
    intermediary?: {
      img?: string;
      name: string;
      website?: string;
    };
    streetNumber?: string;
  };
}

export interface ClassifiedTransaction {
  transaction: Transaction;
  subscription: boolean;
  recurring: boolean;
  minna?: {
    action: string;
    provider: string;
    providerId: string;
    service: string;
    serviceId: string;
  };
  categories: Array<{
    confidence: number;
    main: string;
    mainI18n: string;
    sub: string;
    subI18n: string;
  }>;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  errors: unknown[];
}

export interface ClassifiedTransactionsResponse {
  transactions: ClassifiedTransaction[];
  errors: unknown[];
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
