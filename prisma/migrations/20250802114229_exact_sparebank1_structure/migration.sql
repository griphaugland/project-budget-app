/*
  Warnings:

  - You are about to drop the column `account_key` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `account_number` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `account_properties` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `available_balance` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `currency_code` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `description_code` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `disposal_role` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `product_type` on the `accounts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountNumber` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountProperties` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availableBalance` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currencyCode` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descriptionCode` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disposalRole` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productType` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "accounts_account_key_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "account_key",
DROP COLUMN "account_number",
DROP COLUMN "account_properties",
DROP COLUMN "available_balance",
DROP COLUMN "currency_code",
DROP COLUMN "description_code",
DROP COLUMN "disposal_role",
DROP COLUMN "is_default",
DROP COLUMN "product_id",
DROP COLUMN "product_type",
ADD COLUMN     "accountNumber" TEXT NOT NULL,
ADD COLUMN     "accountProperties" JSONB NOT NULL,
ADD COLUMN     "availableBalance" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "currencyCode" TEXT NOT NULL,
ADD COLUMN     "descriptionCode" TEXT NOT NULL,
ADD COLUMN     "disposalRole" BOOLEAN NOT NULL,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "productType" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_key_key" ON "accounts"("key");
