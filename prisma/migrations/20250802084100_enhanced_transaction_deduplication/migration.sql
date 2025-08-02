/*
  Warnings:

  - A unique constraint covering the columns `[non_unique_id,account_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sparebank1_id,account_id,transaction_date]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "transactions_sparebank1_id_key";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "booking_status" TEXT,
ADD COLUMN     "cleaned_description" TEXT,
ADD COLUMN     "is_confidential" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kid_or_message" TEXT,
ADD COLUMN     "non_unique_id" TEXT,
ADD COLUMN     "remote_account_name" TEXT,
ADD COLUMN     "remote_account_number" TEXT,
ADD COLUMN     "type_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_non_unique_id_account_id_key" ON "transactions"("non_unique_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_sparebank1_id_account_id_transaction_date_key" ON "transactions"("sparebank1_id", "account_id", "transaction_date");
