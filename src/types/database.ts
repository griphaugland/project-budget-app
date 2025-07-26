// Database Model Types

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  sparebank1UserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface Account {
  id: string;
  userId: string;
  accountKey: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  sparebank1Id: string;
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  date: Date;
  categoryId?: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types with relations
export interface AccountWithTransactions extends Account {
  transactions: Transaction[];
}

export interface TransactionWithCategory extends Transaction {
  category?: Category;
  account: Account;
}

export interface BudgetWithCategory extends Budget {
  category: Category;
}

export interface CategoryWithTransactions extends Category {
  transactions: Transaction[];
  budgets: Budget[];
}

// Create/Update types
export interface CreateAccountData {
  accountKey: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency?: string;
  isDefault?: boolean;
}

export interface CreateTransactionData {
  accountId: string;
  sparebank1Id: string;
  amount: number;
  currency?: string;
  description: string;
  merchantName?: string;
  date: Date;
  categoryId?: string;
  isRecurring?: boolean;
}

export interface CreateBudgetData {
  categoryId: string;
  name: string;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate?: Date;
}

export interface CreateCategoryData {
  name: string;
  color: string;
  icon?: string;
}
