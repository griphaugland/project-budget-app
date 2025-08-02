/*
  Warnings:

  - You are about to drop the column `account_currency` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `account_key` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `account_name` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `account_number` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `booking_status` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `can_show_details` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `classification_input` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `cleaned_description` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `currency_code` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_confidential` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_from_currency_account` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `kid_or_message` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `non_unique_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `remote_account_name` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `remote_account_number` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `type_code` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `accountCurrency` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountKey` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountName` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountNumber` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingStatus` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canShowDetails` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currencyCode` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isConfidential` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isFromCurrencyAccount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeCode` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "account_currency",
DROP COLUMN "account_key",
DROP COLUMN "account_name",
DROP COLUMN "account_number",
DROP COLUMN "booking_status",
DROP COLUMN "can_show_details",
DROP COLUMN "classification_input",
DROP COLUMN "cleaned_description",
DROP COLUMN "currency_code",
DROP COLUMN "is_confidential",
DROP COLUMN "is_from_currency_account",
DROP COLUMN "kid_or_message",
DROP COLUMN "non_unique_id",
DROP COLUMN "remote_account_name",
DROP COLUMN "remote_account_number",
DROP COLUMN "type_code",
ADD COLUMN     "accountCurrency" TEXT NOT NULL,
ADD COLUMN     "accountKey" TEXT NOT NULL,
ADD COLUMN     "accountName" TEXT NOT NULL,
ADD COLUMN     "accountNumber" JSONB NOT NULL,
ADD COLUMN     "bookingStatus" TEXT NOT NULL,
ADD COLUMN     "canShowDetails" BOOLEAN NOT NULL,
ADD COLUMN     "classificationInput" JSONB,
ADD COLUMN     "cleanedDescription" TEXT,
ADD COLUMN     "currencyCode" TEXT NOT NULL,
ADD COLUMN     "isConfidential" BOOLEAN NOT NULL,
ADD COLUMN     "isFromCurrencyAccount" BOOLEAN NOT NULL,
ADD COLUMN     "kidOrMessage" TEXT,
ADD COLUMN     "nonUniqueId" TEXT,
ADD COLUMN     "remoteAccountName" TEXT,
ADD COLUMN     "remoteAccountNumber" TEXT,
ADD COLUMN     "typeCode" TEXT NOT NULL;
