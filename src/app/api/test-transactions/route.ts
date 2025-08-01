import { NextRequest, NextResponse } from "next/server";
import { getSpareBank1ClientFromToken } from "@/lib/sparebank1-simple";
import {
  Transaction,
  Account,
  ClassifiedTransaction,
} from "@/types/sparebank1";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Testing SpareBank1 Transaction APIs...");

    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No access token provided",
          message: "Please provide a valid SpareBank1 access token",
        },
        { status: 400 }
      );
    }

    const client = getSpareBank1ClientFromToken(accessToken);

    // First, get accounts to extract account keys (required for transaction calls)
    console.log("🔄 Getting accounts for transaction context...");
    let accounts: Account[] = [];
    let accountError = null;

    try {
      accounts = await client.getAccounts();
      console.log(
        `✅ Fetched ${accounts.length} accounts for transaction testing`
      );
    } catch (error) {
      console.error("❌ Account fetch failed:", error);
      accountError = error instanceof Error ? error.message : "Unknown error";
    }

    // Filter to target accounts for focused testing
    const targetAccountNumbers = ["32092736910", "32042120676"];
    const testAccounts = accounts.filter((acc) =>
      targetAccountNumbers.includes(acc.accountNumber)
    );

    console.log(
      `🎯 Found ${testAccounts.length} target accounts for testing:`,
      testAccounts.map((acc) => ({
        name: acc.name,
        accountNumber: acc.accountNumber,
      }))
    );

    // Test 1: Get basic transactions - USE HISTORICAL DATES + ACCOUNT KEYS
    console.log("🔄 Testing basic transaction fetch...");
    // Using historical dates from 2024 where real transaction data would exist
    const fromDate = "2024-11-01";
    const toDate = "2024-12-31";

    console.log("🗓️ Using historical date range for testing:", {
      fromDate,
      toDate,
      note: "Nov-Dec 2024 should have real transaction data",
    });

    let transactions: Transaction[] = [];
    let transactionError = null;

    if (testAccounts.length > 0) {
      const accountKeys = testAccounts.map((acc) => acc.accountKey);
      console.log("🔑 Using account keys:", accountKeys);

      try {
        transactions = await client.getTransactions({
          accountKey: accountKeys, // REQUIRED parameter according to API spec
          fromDate,
          toDate,
          rowLimit: 10, // Limit to 10 for testing
          source: "ALL", // Get all transactions
          enrichWithPaymentDetails: true,
          enrichWithMerchantLogo: true,
        });
        console.log("✅ Transactions fetched successfully!");
      } catch (error) {
        console.error("❌ Transaction fetch failed:", error);
        transactionError =
          error instanceof Error ? error.message : "Unknown error";
      }
    } else {
      transactionError = "No target accounts found for transaction testing";
      console.log(
        "⚠️ Skipping transaction test - no target accounts available"
      );
    }

    // Test 2: Get classified transactions (may have category info)
    console.log("🔄 Testing classified transaction fetch...");
    let classifiedTransactions: ClassifiedTransaction[] = [];
    let classifiedError = null;

    if (testAccounts.length > 0) {
      const accountKeys = testAccounts.map((acc) => acc.accountKey);

      try {
        classifiedTransactions = await client.getClassifiedTransactions({
          accountKey: accountKeys, // REQUIRED parameter according to API spec
          fromDate,
          toDate,
          rowLimit: 5, // Limit to 5 for testing
          source: "ALL", // Get all transactions
          enrichWithPaymentDetails: true,
          enrichWithMerchantLogo: true,
        });
        console.log("✅ Classified transactions fetched successfully!");
      } catch (error) {
        console.error("❌ Classified transaction fetch failed:", error);
        classifiedError =
          error instanceof Error ? error.message : "Unknown error";
      }
    } else {
      classifiedError =
        "No target accounts found for classified transaction testing";
      console.log(
        "⚠️ Skipping classified transaction test - no target accounts available"
      );
    }

    // Test 3: Summary of results

    return NextResponse.json({
      success: true,
      message: "SpareBank1 Transaction API exploration completed!",
      data: {
        testParameters: {
          dateRange: `${fromDate} to ${toDate}`,
          transactionLimit: 10,
          classifiedLimit: 5,
        },
        transactions: {
          success: !transactionError,
          error: transactionError,
          count: transactions?.length || 0,
          sample: transactions?.slice(0, 3) || [],
          structure:
            transactions?.length > 0 ? Object.keys(transactions[0]) : [],
        },
        classifiedTransactions: {
          success: !classifiedError,
          error: classifiedError,
          count: classifiedTransactions?.length || 0,
          sample: classifiedTransactions?.slice(0, 2) || [],
          structure:
            classifiedTransactions?.length > 0
              ? Object.keys(classifiedTransactions[0])
              : [],
        },
        accounts: {
          success: !accountError,
          error: accountError,
          count: accounts?.length || 0,
          totalFetched: accounts?.length || 0,
          targetAccountsFound: testAccounts?.length || 0,
          targetAccountNumbers,
          accountKeys: testAccounts?.map((acc) => acc.accountKey) || [],
          accountNames: testAccounts?.map((acc) => acc.name) || [],
        },
        dataInsights: {
          recommendedFields: [
            "transactionId",
            "amount",
            "currency",
            "description",
            "merchantName",
            "date",
            "accountKey",
            "category",
          ],
          nextSteps: [
            "1. Analyze transaction data structure",
            "2. Design database schema based on actual data",
            "3. Create transaction sync mechanism",
            "4. Build transaction management UI",
          ],
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ Transaction API test failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "api_test_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
