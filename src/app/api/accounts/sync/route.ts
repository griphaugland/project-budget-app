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

    console.log("Starting account sync for user:", session.user.id);

    // Check if we have access token for SpareBank1 API
    if (!session.accessToken) {
      return NextResponse.json(
        {
          error: "No SpareBank1 access token available. Please sign in again.",
        },
        { status: 401 }
      );
    }

    // Real SpareBank1 API calls only
    const client = await getSpareBank1Client();
    const accounts = await client.getAccounts();

    // Get account balances for each account
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        try {
          const balance = await client.getAccountBalance(account.accountKey);
          return {
            ...account,
            balance,
          };
        } catch (error) {
          console.error(
            `Failed to get balance for account ${account.accountKey}:`,
            error
          );
          throw new Error(
            `Failed to fetch balance for account ${account.name}`
          );
        }
      })
    );

    // Sync accounts to database
    const syncedAccounts = await Promise.all(
      accountsWithBalances.map(async (account) => {
        return await prisma.bankAccount.upsert({
          where: { accountKey: account.accountKey },
          update: {
            accountName: account.name,
            accountType: account.type,
            balance: account.balance.amount,
            currency: account.balance.currency,
            isDefault: account.isDefault || false,
          },
          create: {
            userId: session.user.id!,
            accountKey: account.accountKey,
            accountName: account.name,
            accountType: account.type,
            balance: account.balance.amount,
            currency: account.balance.currency,
            isDefault: account.isDefault || false,
          },
        });
      })
    );

    console.log("Successfully synced accounts:", syncedAccounts.length);

    return NextResponse.json({
      accounts: syncedAccounts,
      message: `Successfully synced ${syncedAccounts.length} accounts from SpareBank1`,
    });
  } catch (error) {
    console.error("Account sync error:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (
        error.message.includes("connect") ||
        error.message.includes("database")
      ) {
        return NextResponse.json(
          {
            error:
              "Database connection failed. Please check your DATABASE_URL configuration.",
          },
          { status: 500 }
        );
      }

      if (
        error.message.includes("access token") ||
        error.message.includes("unauthorized")
      ) {
        return NextResponse.json(
          { error: "SpareBank1 authentication failed. Please sign in again." },
          { status: 401 }
        );
      }

      if (error.message.includes("Failed to fetch balance")) {
        return NextResponse.json(
          {
            error:
              "Unable to retrieve account balances from SpareBank1. Please try again.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to sync accounts from SpareBank1. Please try again." },
      { status: 500 }
    );
  }
}
