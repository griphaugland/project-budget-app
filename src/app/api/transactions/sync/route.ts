import { NextRequest, NextResponse } from "next/server";
import { getSpareBank1ClientFromToken } from "@/lib/sparebank1-simple";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting transaction sync from SpareBank1...");

    const { accessToken, accountKey, dateRange } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_token",
          message: "No access token provided",
        },
        { status: 400 }
      );
    }

    // Create SpareBank1 client
    const spareBank1Client = getSpareBank1ClientFromToken(accessToken);

    // Set up date range - USE HISTORICAL DATES THAT WOULD HAVE REAL DATA
    // Since it's 2025, we need to look at past dates where transactions actually exist
    const endDate = new Date("2024-12-31"); // End of 2024
    const startDate = new Date("2024-11-01"); // November-December 2024 (2 months of data)

    const fromDate = startDate.toISOString().split("T")[0];
    const toDate = endDate.toISOString().split("T")[0];

    console.log(`📅 Syncing transactions from ${fromDate} to ${toDate}`);
    console.log(`📅 Using historical date range for real transaction data:`, {
      endDate: endDate.toISOString(),
      startDate: startDate.toISOString(),
      fromDate,
      toDate,
      note: "Looking at Nov-Dec 2024 for actual transaction history",
    });

    // First, ensure we have the user's accounts in our database
    console.log("🔄 Syncing accounts first...");
    const spareBank1Accounts = await spareBank1Client.getAccounts();

    // For now, create a simple user record (in a real app, you'd have proper user management)
    let user = await prisma.user.findFirst({
      where: { sparebank1CustomerKey: { not: null } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "SpareBank1 User",
          sparebank1CustomerKey: "temp_user", // This would be from actual user data
        },
      });
    }

    // Sync accounts to database
    const accountSyncResults = [];
    for (const sbAccount of spareBank1Accounts) {
      try {
        const existingAccount = await prisma.bankAccount.findUnique({
          where: { accountKey: sbAccount.accountKey },
        });

        const accountData = {
          userId: user.id,
          accountKey: sbAccount.accountKey,
          accountNumber: sbAccount.accountNumber || "N/A",
          iban: sbAccount.iban || "N/A",
          name: sbAccount.name,
          description: sbAccount.type || sbAccount.description || "",
          balance: Number(sbAccount.balance?.amount || 0),
          availableBalance: Number(sbAccount.balance?.amount || 0),
          currencyCode: sbAccount.balance?.currency || "NOK",
          productType: sbAccount.productType || "UNKNOWN",
          accountType: sbAccount.type || "USER",
          productId: sbAccount.productId || "",
          descriptionCode: sbAccount.descriptionCode || "",
          disposalRole: sbAccount.disposalRole || false,
          isDefaultPaymentAccount: sbAccount.isDefault || false,
          isSavingsAccount:
            sbAccount.type === "SAVING" || sbAccount.type === "BSU",
          lastSyncedAt: new Date(),
        };

        if (existingAccount) {
          await prisma.bankAccount.update({
            where: { id: existingAccount.id },
            data: accountData,
          });
        } else {
          await prisma.bankAccount.create({
            data: accountData,
          });
        }

        accountSyncResults.push({
          accountKey: sbAccount.accountKey,
          name: sbAccount.name,
          synced: true,
        });
      } catch (error) {
        console.error(`Failed to sync account ${sbAccount.accountKey}:`, error);
        accountSyncResults.push({
          accountKey: sbAccount.accountKey,
          name: sbAccount.name,
          synced: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(`✅ Synced ${accountSyncResults.length} accounts`);

    // Now sync transactions
    console.log("🔄 Fetching transactions from SpareBank1...");

    const transactionSyncResults = [];
    let totalTransactionsFetched = 0;
    let totalTransactionsSaved = 0;

    // Filter to specific accounts for testing
    const targetAccountNumbers = ["32092736910", "32042120676"]; // Focus on these 2 accounts for debugging

    const accountsToSync = accountKey
      ? spareBank1Accounts.filter((acc) => acc.accountKey === accountKey)
      : spareBank1Accounts.filter((acc) =>
          targetAccountNumbers.includes(acc.accountNumber)
        );

    console.log(
      `🎯 Filtered to ${accountsToSync.length} target accounts:`,
      accountsToSync.map((acc) => ({
        name: acc.name,
        accountNumber: acc.accountNumber,
      }))
    );

    for (const account of accountsToSync) {
      try {
        console.log(`📊 Fetching transactions for account: ${account.name}`);

        // Get our database account record
        const dbAccount = await prisma.bankAccount.findUnique({
          where: { accountKey: account.accountKey },
        });

        if (!dbAccount) {
          console.warn(
            `⚠️ Account ${account.accountKey} not found in database`
          );
          continue;
        }

        // Fetch transactions from SpareBank1
        console.log(
          `🔍 Fetching transactions for account ${account.accountKey} (${account.name}) from ${fromDate} to ${toDate}`
        );

        let transactions;
        try {
          transactions = await spareBank1Client.getTransactions({
            fromDate,
            toDate,
            accountKey: account.accountKey,
            page: 0,
            size: 100, // Fetch up to 100 transactions
          });
        } catch (transactionError) {
          console.error(
            `❌ Failed to fetch transactions for account ${account.name}:`,
            transactionError
          );
          transactionSyncResults.push({
            accountKey: account.accountKey,
            accountName: account.name,
            transactionsFetched: 0,
            success: false,
            error:
              transactionError instanceof Error
                ? transactionError.message
                : "Unknown transaction fetch error",
          });
          continue; // Skip to next account
        }

        console.log(`📊 SpareBank1 API returned:`, {
          accountKey: account.accountKey,
          accountName: account.name,
          transactionCount: transactions?.length || 0,
          transactionType: typeof transactions,
          isArray: Array.isArray(transactions),
          sampleTransaction: transactions?.length > 0 ? transactions[0] : null,
        });

        totalTransactionsFetched += transactions?.length || 0;

        if (transactions && transactions.length > 0) {
          console.log(
            `📦 Processing ${transactions.length} transactions for ${account.name}`
          );

          for (const transaction of transactions) {
            try {
              console.log(`🔍 Processing transaction:`, {
                id: transaction.id,
                amount: transaction.amount,
                description: transaction.description,
                date: transaction.date,
                hasId: !!transaction.id,
              });

              // Check if transaction already exists
              const existingTransaction = transaction.id
                ? await prisma.transaction.findUnique({
                    where: { sparebank1Id: String(transaction.id) },
                  })
                : null;

              if (existingTransaction) {
                console.log(
                  `⏭️ Transaction ${transaction.id} already exists, skipping`
                );
                continue;
              }

              if (!transaction.id) {
                console.warn(
                  `⚠️ Transaction missing ID, skipping:`,
                  transaction
                );
                continue;
              }

              // Create new transaction
              console.log(`💾 Saving new transaction ${transaction.id}`);
              await prisma.transaction.create({
                data: {
                  userId: user.id,
                  accountId: dbAccount.id,
                  sparebank1Id: String(transaction.id),
                  amount: Number(transaction.amount || 0),
                  currency: transaction.currency || "NOK",
                  description: transaction.description || "No description",
                  merchantName: transaction.merchantName || null,
                  transactionDate: transaction.date
                    ? new Date(transaction.date)
                    : new Date(),
                  isIncome: Number(transaction.amount || 0) > 0,
                  isManual: false,
                  sparebank1Type: transaction.type || null,
                  sparebank1Code: transaction.code || null,
                  sparebank1Reference: transaction.reference || null,
                  syncedAt: new Date(),
                },
              });

              totalTransactionsSaved++;
              console.log(
                `✅ Saved transaction ${transaction.id} successfully`
              );
            } catch (error) {
              console.error(
                `❌ Failed to save transaction ${transaction.id}:`,
                error
              );
            }
          }
        } else {
          console.log(
            `📭 No transactions found for account ${account.name} in the specified date range`
          );
        }

        transactionSyncResults.push({
          accountKey: account.accountKey,
          accountName: account.name,
          transactionsFetched: transactions?.length || 0,
          success: true,
        });
      } catch (error) {
        console.error(
          `Failed to sync transactions for account ${account.accountKey}:`,
          error
        );
        transactionSyncResults.push({
          accountKey: account.accountKey,
          accountName: account.name,
          transactionsFetched: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `✅ Transaction sync completed: ${totalTransactionsSaved}/${totalTransactionsFetched} saved`
    );

    return NextResponse.json({
      success: true,
      message: "Transaction sync completed successfully",
      data: {
        dateRange: {
          from: fromDate,
          to: toDate,
        },
        accounts: {
          total: accountSyncResults.length,
          synced: accountSyncResults.filter((a) => a.synced).length,
          results: accountSyncResults,
        },
        transactions: {
          totalFetched: totalTransactionsFetched,
          totalSaved: totalTransactionsSaved,
          accountResults: transactionSyncResults,
        },
        summary: {
          accountsSynced: accountSyncResults.filter((a) => a.synced).length,
          transactionsSaved: totalTransactionsSaved,
          dateRange: `${fromDate} to ${toDate}`,
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ Transaction sync failed:", error);

    // Check if this is a rate limit error
    const isRateLimit =
      error &&
      typeof error === "object" &&
      "isRateLimit" in error &&
      error.isRateLimit;

    if (isRateLimit) {
      return NextResponse.json(
        {
          success: false,
          error: "rate_limited",
          message: "SpareBank1 API rate limit exceeded",
          details:
            "You've made too many API requests. Please wait 30-60 minutes before trying again.",
          retryAfter: "30-60 minutes",
          troubleshooting: {
            suggestion:
              "Wait for the rate limit to reset, then try again with smaller date ranges",
            rateLimitInfo:
              "SpareBank1 limits the number of API calls per hour/day",
          },
        },
        { status: 429 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "sync_failed",
        message: errorMessage,
        troubleshooting: {
          common_issues: [
            "Check access token validity",
            "Verify SpareBank1 API connectivity",
            "Check database connection",
            "Ensure proper permissions",
            "Check if rate limited (wait 30-60 min)",
          ],
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
