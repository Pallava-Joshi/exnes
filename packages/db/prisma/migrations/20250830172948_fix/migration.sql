/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Balance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qty` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `asset` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."token" AS ENUM ('BTCUSDT', 'SOLUSDT', 'ETHUSDT');

-- CreateEnum
CREATE TYPE "public"."orderType" AS ENUM ('LONG', 'PUT');

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "updatedAt",
ADD COLUMN     "qty" DECIMAL(30,10) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."orderType" NOT NULL,
DROP COLUMN "asset",
ADD COLUMN     "asset" "public"."token" NOT NULL,
ALTER COLUMN "finalPnL" SET DEFAULT 0;

-- DropEnum
DROP TYPE "public"."AssetType";

-- DropEnum
DROP TYPE "public"."OrderType";

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_key" ON "public"."Balance"("userId");
