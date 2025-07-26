# Personal Budget App Development Plan

## SpareBank1 API Integration

### Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [Project Setup](#project-setup)
4. [Database Design](#database-design)
5. [Authentication System](#authentication-system)
6. [API Integration](#api-integration)
7. [Frontend Components](#frontend-components)
8. [Backend Services](#backend-services)
9. [Implementation Phases](#implementation-phases)
10. [Security Considerations](#security-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)

---

## Project Overview

### Goal

Create a comprehensive personal budgeting application that integrates with SpareBank1's Open Banking APIs to provide users with real-time financial insights, budget tracking, and spending analytics.

### Key Features

- **Account Management**: View all bank accounts with real-time balances
- **Transaction Tracking**: Import and categorize all transactions
- **Budget Creation**: Set and monitor spending budgets by category
- **Analytics Dashboard**: Visual spending insights and trends
- **Goal Setting**: Savings goals and progress tracking
- **Expense Reports**: Detailed financial reports and exports

---

## Technical Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts or Chart.js
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation

### Backend

- **API Routes**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with OAuth
- **Caching**: Redis (optional)

### External APIs

- **Banking**: SpareBank1 Open Banking APIs
- **Notifications**: (Optional) Email/SMS services

---

## Project Setup

### 1. Environment Configuration

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/budget_app"

# SpareBank1 OAuth
SPAREBANK1_CLIENT_ID="your_client_id"
SPAREBANK1_CLIENT_SECRET="your_client_secret"
SPAREBANK1_REDIRECT_URI="http://localhost:3000/api/auth/callback/sparebank1"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

# Optional
REDIS_URL="redis://localhost:6379"
```

### 2. Dependencies Installation

```bash
# Core dependencies
npm install @prisma/client prisma
npm install next-auth
npm install @hookform/resolvers react-hook-form zod
npm install zustand
npm install recharts
npm install axios
npm install date-fns

# UI Dependencies
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install lucide-react
npm install tailwindcss @tailwindcss/forms

# Development
npm install -D @types/node typescript
npm install -D eslint eslint-config-next
```

### 3. Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   └── sparebank1/
│   ├── components/
│   │   ├── ui/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   └── analytics/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   ├── sparebank1.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   └── budgets.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── sparebank1.ts
│   │   ├── database.ts
│   │   └── api.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useAccounts.ts
│       ├── useTransactions.ts
│       └── useBudgets.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── public/
    └── icons/
```

---

## Database Design

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // SpareBank1 Integration
  sparebank1UserId String? @unique
  accessToken      String?
  refreshToken     String?
  tokenExpiresAt   DateTime?

  // Relations
  accounts     Account[]
  transactions Transaction[]
  budgets      Budget[]
  categories   Category[]

  @@map("users")
}

model Account {
  id          String   @id @default(cuid())
  userId      String
  accountKey  String   @unique // SpareBank1 account key
  accountName String
  accountType String
  balance     Decimal
  currency    String   @default("NOK")
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("accounts")
}

model Transaction {
  id              String   @id @default(cuid())
  userId          String
  accountId       String
  sparebank1Id    String   @unique // SpareBank1 transaction ID
  amount          Decimal
  currency        String   @default("NOK")
  description     String
  merchantName    String?
  date            DateTime
  categoryId      String?
  isRecurring     Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  account  Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id])

  @@map("transactions")
}

model Category {
  id     String @id @default(cuid())
  userId String
  name   String
  color  String
  icon   String?

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]

  @@unique([userId, name])
  @@map("categories")
}

model Budget {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  name       String
  amount     Decimal
  period     String   // 'monthly', 'weekly', 'yearly'
  startDate  DateTime
  endDate    DateTime?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@map("budgets")
}
```

---

## Authentication System

### 1. NextAuth Configuration

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./database";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "sparebank1",
      name: "SpareBank1",
      type: "oauth",
      authorization: {
        url: "https://api.sparebank1.no/oauth/authorize",
        params: {
          scope: "accounts transactions",
          response_type: "code",
        },
      },
      token: "https://api.sparebank1.no/oauth/token",
      userinfo: "https://api.sparebank1.no/personal/user/info",
      clientId: process.env.SPAREBANK1_CLIENT_ID,
      clientSecret: process.env.SPAREBANK1_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
};
```

### 2. SpareBank1 API Client

```typescript
// src/lib/sparebank1.ts
import axios, { AxiosInstance } from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

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
      },
    });
  }

  // Account Methods
  async getAccounts() {
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

  // Transaction Methods
  async getTransactions(params?: {
    fromDate?: string;
    toDate?: string;
    accountKey?: string;
  }) {
    const response = await this.client.get("/transactions", { params });
    return response.data;
  }

  async getClassifiedTransactions(params?: {
    fromDate?: string;
    toDate?: string;
    accountKey?: string;
  }) {
    const response = await this.client.get("/transactions/classified", {
      params,
    });
    return response.data;
  }

  async getTransactionDetails(transactionId: string) {
    const response = await this.client.get(
      `/transactions/${transactionId}/details`
    );
    return response.data;
  }

  async exportTransactions(params: {
    fromDate: string;
    toDate: string;
    accountKey?: string;
  }) {
    const response = await this.client.get("/transactions/export", { params });
    return response.data;
  }

  // Credit Card Methods
  async transferToCreditCard(data: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    currency?: string;
  }) {
    const response = await this.client.post("/creditcard/transferTo", data);
    return response.data;
  }
}

export async function getSpareBank1Client() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    throw new Error("No access token available");
  }

  return new SpareBank1Client(session.accessToken as string);
}
```

---

## API Integration

### 1. Account Sync API Route

```typescript
// src/app/api/accounts/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSpareBank1Client } from "@/lib/sparebank1";
import { prisma } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getSpareBank1Client();
    const accounts = await client.getAccounts();

    // Sync accounts to database
    const syncedAccounts = await Promise.all(
      accounts.map(async (account: any) => {
        const balance = await client.getAccountBalance(account.accountKey);

        return await prisma.account.upsert({
          where: { accountKey: account.accountKey },
          update: {
            accountName: account.name,
            accountType: account.type,
            balance: balance.amount,
            currency: balance.currency,
          },
          create: {
            userId: session.user.id,
            accountKey: account.accountKey,
            accountName: account.name,
            accountType: account.type,
            balance: balance.amount,
            currency: balance.currency,
            isDefault: account.isDefault || false,
          },
        });
      })
    );

    return NextResponse.json({ accounts: syncedAccounts });
  } catch (error) {
    console.error("Account sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync accounts" },
      { status: 500 }
    );
  }
}
```

### 2. Transaction Sync API Route

```typescript
// src/app/api/transactions/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSpareBank1Client } from "@/lib/sparebank1";
import { prisma } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fromDate, toDate, accountKey } = await request.json();

    const client = await getSpareBank1Client();
    const transactions = await client.getClassifiedTransactions({
      fromDate,
      toDate,
      accountKey,
    });

    // Get user's accounts for mapping
    const userAccounts = await prisma.account.findMany({
      where: { userId: session.user.id },
    });

    const accountMap = new Map(
      userAccounts.map((acc) => [acc.accountKey, acc.id])
    );

    // Sync transactions to database
    const syncedTransactions = await Promise.all(
      transactions.map(async (transaction: any) => {
        const accountId = accountMap.get(transaction.accountKey);

        if (!accountId) {
          console.warn(`Account not found for transaction: ${transaction.id}`);
          return null;
        }

        return await prisma.transaction.upsert({
          where: { sparebank1Id: transaction.id },
          update: {
            amount: transaction.amount,
            description: transaction.description,
            merchantName: transaction.merchant?.name,
            date: new Date(transaction.date),
          },
          create: {
            userId: session.user.id,
            accountId,
            sparebank1Id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
            merchantName: transaction.merchant?.name,
            date: new Date(transaction.date),
          },
        });
      })
    );

    const validTransactions = syncedTransactions.filter(Boolean);

    return NextResponse.json({
      transactions: validTransactions,
      count: validTransactions.length,
    });
  } catch (error) {
    console.error("Transaction sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
```

---

## Frontend Components

### 1. Dashboard Layout

```typescript
// src/components/dashboard/DashboardLayout.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via middleware
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 2. Account Overview Component

```typescript
// src/components/accounts/AccountOverview.tsx
"use client";

import { useEffect } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { AccountCard } from "./AccountCard";
import { SyncButton } from "./SyncButton";
import { formatCurrency } from "@/lib/utils";

export function AccountOverview() {
  const { accounts, loading, error, syncAccounts, totalBalance } =
    useAccounts();

  useEffect(() => {
    if (accounts.length === 0) {
      syncAccounts();
    }
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading accounts...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading accounts: {error}</p>
        <SyncButton onSync={syncAccounts} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
          <p className="text-gray-600">
            Total Balance: {formatCurrency(totalBalance, "NOK")}
          </p>
        </div>
        <SyncButton onSync={syncAccounts} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Transaction List Component

```typescript
// src/components/transactions/TransactionList.tsx
"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionItem } from "./TransactionItem";
import { TransactionFilters } from "./TransactionFilters";
import { Pagination } from "@/components/ui/Pagination";

export function TransactionList() {
  const { transactions, loading, error, syncTransactions } = useTransactions();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    account: "",
    dateRange: { from: null, to: null },
  });

  const itemsPerPage = 20;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (
        filters.search &&
        !transaction.description
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.category && transaction.category?.id !== filters.category) {
        return false;
      }

      if (filters.account && transaction.accountId !== filters.account) {
        return false;
      }

      if (
        filters.dateRange.from &&
        new Date(transaction.date) < filters.dateRange.from
      ) {
        return false;
      }

      if (
        filters.dateRange.to &&
        new Date(transaction.date) > filters.dateRange.to
      ) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <TransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSync={syncTransactions}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading transactions: {error}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
```

### 4. Budget Creation Component

```typescript
// src/components/budgets/BudgetForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  period: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.date(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export function BudgetForm() {
  const { createBudget, loading } = useBudgets();
  const { categories } = useCategories();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
  });

  const onSubmit = async (data: BudgetFormData) => {
    try {
      await createBudget(data);
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create budget:", error);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Create Budget</Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Budget</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Budget Name
                </label>
                <Input {...register("name")} placeholder="Monthly Groceries" />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <Select {...register("categoryId")}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                {errors.categoryId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (NOK)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                  placeholder="5000"
                />
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Period</label>
                <Select {...register("period")}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
                {errors.period && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.period.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  {...register("startDate", { valueAsDate: true })}
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Create Budget
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Phases

### **Phase 1: Foundation (Week 1-2)**

#### Goals

- Set up project structure and authentication
- Implement basic SpareBank1 API integration
- Create simple dashboard with account overview

#### Tasks

1. **Project Setup**

   - Initialize Next.js project with required dependencies
   - Set up database with Prisma
   - Configure environment variables

2. **Authentication**

   - Implement NextAuth.js with SpareBank1 OAuth
   - Create login/logout flow
   - Set up token refresh mechanism

3. **Basic API Integration**

   - Create SpareBank1 API client
   - Implement account fetching and syncing
   - Create account overview page

4. **UI Foundation**
   - Set up Tailwind CSS and basic components
   - Create dashboard layout
   - Implement responsive design

#### Deliverables

- Working authentication system
- Account overview with real bank data
- Basic dashboard layout

### **Phase 2: Core Features (Week 3-4)**

#### Goals

- Implement transaction management
- Add basic categorization
- Create budget tracking functionality

#### Tasks

1. **Transaction Management**

   - Implement transaction sync from SpareBank1
   - Create transaction list with filtering
   - Add transaction search functionality

2. **Categorization System**

   - Create category management
   - Implement automatic categorization based on SpareBank1 data
   - Allow manual category assignment

3. **Budget Creation**

   - Create budget management system
   - Implement budget vs actual spending tracking
   - Add budget progress indicators

4. **Data Visualization**
   - Integrate charts library
   - Create spending overview charts
   - Add category breakdown visualizations

#### Deliverables

- Complete transaction management
- Working budget system
- Basic analytics dashboard

### **Phase 3: Advanced Features (Week 5-6)**

#### Goals

- Add advanced analytics and reporting
- Implement goal setting
- Create export functionality

#### Tasks

1. **Advanced Analytics**

   - Create spending trend analysis
   - Implement month-over-month comparisons
   - Add predictive insights

2. **Goal Setting**

   - Create savings goal system
   - Track progress toward financial objectives
   - Add milestone notifications

3. **Export & Reporting**

   - Implement CSV export using SpareBank1 API
   - Create custom report generation
   - Add PDF report functionality

4. **Performance Optimization**
   - Implement caching strategies
   - Optimize database queries
   - Add background sync jobs

#### Deliverables

- Advanced analytics dashboard
- Goal tracking system
- Export functionality

### **Phase 4: Polish & Enhancement (Week 7-8)**

#### Goals

- Improve user experience
- Add smart features
- Prepare for deployment

#### Tasks

1. **UX Enhancements**

   - Implement smart notifications
   - Add onboarding flow
   - Improve mobile responsiveness

2. **Smart Features**

   - Add spending alerts
   - Implement bill tracking
   - Create smart categorization suggestions

3. **Testing & Quality**

   - Write comprehensive tests
   - Perform security audit
   - Optimize performance

4. **Deployment Preparation**
   - Set up production environment
   - Configure monitoring
   - Create deployment documentation

#### Deliverables

- Production-ready application
- Comprehensive test suite
- Deployment documentation

---

## Security Considerations

### 1. Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Regular security audits

### 2. API Security

- Secure token storage and refresh
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration

### 3. User Privacy

- Minimal data collection
- Clear privacy policy
- Data retention policies
- User data deletion capabilities

### 4. Authentication

- Secure OAuth implementation
- Session timeout management
- Multi-factor authentication (future)
- Account lockout protection

---

## Testing Strategy

### 1. Unit Tests

```typescript
// Example: Account service tests
import { describe, it, expect, beforeEach } from "vitest";
import { AccountService } from "@/services/AccountService";
import { mockSpareBank1Client } from "@/test/mocks";

describe("AccountService", () => {
  let accountService: AccountService;

  beforeEach(() => {
    accountService = new AccountService(mockSpareBank1Client);
  });

  it("should sync accounts from SpareBank1", async () => {
    const accounts = await accountService.syncAccounts("user-id");
    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toHaveProperty("accountKey");
  });
});
```

### 2. Integration Tests

- API endpoint testing
- Database integration tests
- SpareBank1 API integration tests

### 3. E2E Tests

- User authentication flow
- Account synchronization
- Budget creation and tracking
- Transaction management

---

## Deployment

### 1. Environment Setup

- Production environment variables
- Database setup and migrations
- SSL certificate configuration

### 2. Hosting Options

- **Vercel** (Recommended for Next.js)
- **Railway** or **Render** (with PostgreSQL)
- **AWS** or **Google Cloud** (for enterprise)

### 3. Monitoring

- Error tracking (Sentry)
- Performance monitoring
- API usage analytics
- User behavior tracking

### 4. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## Getting Started

1. **Clone and Setup**

   ```bash
   git clone <repository>
   cd project-budget-app
   npm install
   ```

2. **Environment Configuration**

   - Copy `.env.example` to `.env.local`
   - Fill in SpareBank1 OAuth credentials
   - Set up database connection

3. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development**

   ```bash
   npm run dev
   ```

5. **Follow Phase 1 Implementation**
   - Start with authentication setup
   - Implement basic account sync
   - Build foundation components

---

This comprehensive plan provides a roadmap for building a full-featured personal budgeting app integrated with SpareBank1's APIs. Each phase builds upon the previous one, ensuring a systematic and manageable development process.
