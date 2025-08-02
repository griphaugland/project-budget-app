/*
  Warnings:

  - You are about to drop the column `is_active` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `is_income` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_income` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_manual` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_recurring` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `merchant_name` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `sparebank1_code` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `sparebank1_reference` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `sparebank1_type` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_date` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `userNotes` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `sparebank1_customer_key` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `bank_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `budgets` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sparebank1_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `icon` on table `categories` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `account_currency` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_key` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_name` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_number` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `can_show_details` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency_code` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_from_currency_account` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Made the column `sparebank1_id` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `booking_status` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type_code` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "bank_accounts" DROP CONSTRAINT "bank_accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_category_id_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_fkey";

-- DropIndex
DROP INDEX "categories_user_id_name_key";

-- DropIndex
DROP INDEX "transactions_non_unique_id_account_id_key";

-- DropIndex
DROP INDEX "transactions_sparebank1_id_account_id_transaction_date_key";

-- DropIndex
DROP INDEX "users_sparebank1_customer_key_key";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "is_active",
DROP COLUMN "is_income",
DROP COLUMN "sort_order",
DROP COLUMN "user_id",
ALTER COLUMN "color" SET DEFAULT '#6B7280',
ALTER COLUMN "icon" SET NOT NULL,
ALTER COLUMN "icon" SET DEFAULT '📝';

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "category_id",
DROP COLUMN "currency",
DROP COLUMN "is_income",
DROP COLUMN "is_manual",
DROP COLUMN "is_recurring",
DROP COLUMN "merchant_name",
DROP COLUMN "sparebank1_code",
DROP COLUMN "sparebank1_reference",
DROP COLUMN "sparebank1_type",
DROP COLUMN "tags",
DROP COLUMN "transaction_date",
DROP COLUMN "userNotes",
ADD COLUMN     "account_currency" TEXT NOT NULL,
ADD COLUMN     "account_key" TEXT NOT NULL,
ADD COLUMN     "account_name" TEXT NOT NULL,
ADD COLUMN     "account_number" JSONB NOT NULL,
ADD COLUMN     "can_show_details" BOOLEAN NOT NULL,
ADD COLUMN     "classification_input" JSONB,
ADD COLUMN     "currency_code" TEXT NOT NULL,
ADD COLUMN     "date" BIGINT NOT NULL,
ADD COLUMN     "is_from_currency_account" BOOLEAN NOT NULL,
ADD COLUMN     "merchant" JSONB,
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "sparebank1_id" SET NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "booking_status" SET NOT NULL,
ALTER COLUMN "is_confidential" DROP DEFAULT,
ALTER COLUMN "type_code" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "sparebank1_customer_key";

-- DropTable
DROP TABLE "bank_accounts";

-- DropTable
DROP TABLE "budgets";

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_key" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "available_balance" DECIMAL(15,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "description_code" TEXT NOT NULL,
    "disposal_role" BOOLEAN NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "owner" JSONB NOT NULL,
    "account_properties" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_key_key" ON "accounts"("account_key");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_sparebank1_id_key" ON "transactions"("sparebank1_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
