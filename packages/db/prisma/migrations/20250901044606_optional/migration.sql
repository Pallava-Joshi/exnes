-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "stopLoss" DROP NOT NULL,
ALTER COLUMN "takeProfit" DROP NOT NULL;
