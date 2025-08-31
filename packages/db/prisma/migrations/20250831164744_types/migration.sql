/*
  Warnings:

  - You are about to drop the column `type` on the `Order` table. All the data in the column will be lost.
  - Added the required column `orderType` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."position" AS ENUM ('LONG', 'PUT');

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "type",
ADD COLUMN     "orderType" "public"."position" NOT NULL;

-- DropEnum
DROP TYPE "public"."orderType";
