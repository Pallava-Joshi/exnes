/*
  Warnings:

  - The values [PUT] on the enum `position` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."position_new" AS ENUM ('LONG', 'SHORT');
ALTER TABLE "public"."Order" ALTER COLUMN "orderType" TYPE "public"."position_new" USING ("orderType"::text::"public"."position_new");
ALTER TYPE "public"."position" RENAME TO "position_old";
ALTER TYPE "public"."position_new" RENAME TO "position";
DROP TYPE "public"."position_old";
COMMIT;
