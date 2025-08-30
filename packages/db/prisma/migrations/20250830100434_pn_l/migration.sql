/*
  Warnings:

  - Added the required column `finalPnL` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "finalPnL" DECIMAL(30,10) NOT NULL;
