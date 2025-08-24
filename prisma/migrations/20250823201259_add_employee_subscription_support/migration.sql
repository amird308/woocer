-- CreateTable
CREATE TABLE "EmployeeSubscription" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionUsage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "monthYear" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "organizationId",
ADD COLUMN     "discountPercentage" INTEGER DEFAULT 0,
ADD COLUMN     "isEmployeeSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxEmployees" INTEGER,
ADD COLUMN     "sponsorOrganizationId" UUID,
ALTER COLUMN "revenueCatCustomerId" SET UNIQUE;

-- No need to alter User table as employeeSubscriptions is handled via relations

-- CreateIndex
CREATE INDEX "EmployeeSubscription_subscriptionId_idx" ON "EmployeeSubscription"("subscriptionId");

-- CreateIndex
CREATE INDEX "EmployeeSubscription_userId_idx" ON "EmployeeSubscription"("userId");

-- CreateIndex
CREATE INDEX "EmployeeSubscription_organizationId_idx" ON "EmployeeSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "EmployeeSubscription_isActive_idx" ON "EmployeeSubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSubscription_subscriptionId_userId_organizationId_key" ON "EmployeeSubscription"("subscriptionId", "userId", "organizationId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_subscriptionId_idx" ON "SubscriptionUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_organizationId_idx" ON "SubscriptionUsage"("organizationId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_monthYear_idx" ON "SubscriptionUsage"("monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionUsage_subscriptionId_organizationId_monthYear_key" ON "SubscriptionUsage"("subscriptionId", "organizationId", "monthYear");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_isEmployeeSubscription_idx" ON "Subscription"("isEmployeeSubscription");

-- CreateIndex
CREATE INDEX "Subscription_sponsorOrganizationId_idx" ON "Subscription"("sponsorOrganizationId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscription" ADD CONSTRAINT "EmployeeSubscription_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscription" ADD CONSTRAINT "EmployeeSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscription" ADD CONSTRAINT "EmployeeSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove the existing unique constraint on userId_organizationId since we're removing organizationId
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_organizationId_key";
