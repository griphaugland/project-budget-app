import { NextRequest, NextResponse } from "next/server";
import { DatabaseClient } from "@/lib/database-client";

/**
 * Clean Transaction List API
 * - Uses DatabaseClient for database operations only
 * - No field mapping, no transformations
 * - Clean pagination and filtering
 */
export async function GET(request: NextRequest) {
  const dbClient = new DatabaseClient();

  try {
    console.log("📊 Fetching transactions from database...");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const accountId = searchParams.get("accountId");
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const userEmail = searchParams.get("userEmail");

    console.log("🔍 Query parameters:", {
      page,
      limit,
      accountId,
      search,
      fromDate,
      toDate,
      userEmail,
    });

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_user_email",
          message: "User email is required",
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await dbClient.getOrCreateUser(userEmail);

    // Build options for database query
    const options: any = { page, limit };

    if (accountId) options.accountId = accountId;
    if (search) options.search = search;
    if (fromDate) options.fromDate = new Date(fromDate);
    if (toDate) options.toDate = new Date(toDate);

    // Get transactions from database
    const result = await dbClient.getTransactions(user.id, options);

    console.log(
      `✅ Found ${result.transactions.length} transactions (${result.pagination.total} total)`
    );

    // Transform for frontend - convert BigInt dates to ISO strings
    const formattedTransactions = result.transactions.map((transaction) => ({
      id: transaction.id,
      sparebank1_id: transaction.sparebank1_id,
      description: transaction.description,
      amount: parseFloat(transaction.amount.toString()),
      date: new Date(Number(transaction.date)).toISOString(), // Convert BigInt to Date
      currency: transaction.currencyCode,
      accountName: transaction.accountName,
      account: transaction.account
        ? {
            id: transaction.account.id,
            name: transaction.account.name,
            accountNumber: transaction.account.accountNumber,
            type: transaction.account.type,
          }
        : null,
      // SpareBank1 exact fields
      typeCode: transaction.typeCode,
      source: transaction.source,
      bookingStatus: transaction.bookingStatus,
      isConfidential: transaction.isConfidential,
      remoteAccountName: transaction.remoteAccountName,
      remoteAccountNumber: transaction.remoteAccountNumber,
      // JSON fields
      merchant: transaction.merchant,
      classificationInput: transaction.classificationInput,
      // Metadata
      created_at: transaction.created_at.toISOString(),
      synced_at: transaction.synced_at?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: result.pagination,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Failed to fetch transactions:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "fetch_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    await dbClient.disconnect();
  }
}
