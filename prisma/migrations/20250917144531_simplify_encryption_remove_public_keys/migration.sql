/*
  Warnings:

  - You are about to drop the column `privateSecretKey` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `publicSecretKey` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `UserSecret` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "privateSecretKey",
DROP COLUMN "publicSecretKey",
ADD COLUMN     "encryptedData" TEXT;

-- AlterTable
ALTER TABLE "UserSecret" DROP COLUMN "publicKey";
