/*
  Warnings:

  - You are about to drop the column `encryptedData` on the `Organization` table. All the data in the column will be lost.
  - Added the required column `publicKey` to the `UserSecret` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Organization" DROP COLUMN "encryptedData",
ADD COLUMN     "consumerKey" TEXT,
ADD COLUMN     "consumerSecret" TEXT,
ADD COLUMN     "privateSecretKey" TEXT,
ADD COLUMN     "publicSecretKey" TEXT;

-- AlterTable
ALTER TABLE "public"."UserSecret" ADD COLUMN     "publicKey" TEXT NOT NULL;
