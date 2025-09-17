/*
  Warnings:

  - You are about to drop the column `consumerKey` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `consumerSecret` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Organization" DROP COLUMN "consumerKey",
DROP COLUMN "consumerSecret";
