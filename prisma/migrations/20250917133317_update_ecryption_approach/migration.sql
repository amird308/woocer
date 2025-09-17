-- CreateTable
CREATE TABLE "public"."UserSecret" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSecret_userId_idx" ON "public"."UserSecret"("userId");

-- CreateIndex
CREATE INDEX "UserSecret_organizationId_idx" ON "public"."UserSecret"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecret_userId_organizationId_key" ON "public"."UserSecret"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "public"."UserSecret" ADD CONSTRAINT "UserSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSecret" ADD CONSTRAINT "UserSecret_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
