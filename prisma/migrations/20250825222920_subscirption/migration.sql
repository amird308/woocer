-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'PRO', 'AI');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('TRIAL_ALLOCATION', 'PERIOD_ALLOCATION', 'PURCHASED', 'CONSUMED', 'REFUNDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "revenueCatCustomerId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billingPeriod" INTEGER NOT NULL DEFAULT 1,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "usedCredits" INTEGER NOT NULL DEFAULT 0,
    "purchasedCredits" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSubscriptionSponsorship" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "sponsorUserId" UUID NOT NULL,
    "sponsoredUserId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "monthlyCost" DECIMAL(10,2) NOT NULL,
    "discountApplied" DECIMAL(5,2),
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sponsoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSubscriptionSponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipBilling" (
    "id" UUID NOT NULL,
    "sponsorshipId" UUID NOT NULL,
    "sponsorUserId" UUID NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "originalAmount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revenueCatTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPackage" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "revenueCatProductId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "creditPackageId" UUID NOT NULL,
    "revenueCatTransactionId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PurchaseStatus" NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "subscriptionId" UUID,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_revenueCatCustomerId_key" ON "Subscription"("revenueCatCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSubscriptionSponsorship_subscriptionId_key" ON "EmployeeSubscriptionSponsorship"("subscriptionId");

-- CreateIndex
CREATE INDEX "EmployeeSubscriptionSponsorship_sponsorUserId_idx" ON "EmployeeSubscriptionSponsorship"("sponsorUserId");

-- CreateIndex
CREATE INDEX "EmployeeSubscriptionSponsorship_sponsoredUserId_idx" ON "EmployeeSubscriptionSponsorship"("sponsoredUserId");

-- CreateIndex
CREATE INDEX "EmployeeSubscriptionSponsorship_organizationId_idx" ON "EmployeeSubscriptionSponsorship"("organizationId");

-- CreateIndex
CREATE INDEX "EmployeeSubscriptionSponsorship_isActive_idx" ON "EmployeeSubscriptionSponsorship"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSubscriptionSponsorship_sponsoredUserId_organizatio_key" ON "EmployeeSubscriptionSponsorship"("sponsoredUserId", "organizationId", "sponsorUserId");

-- CreateIndex
CREATE INDEX "SponsorshipBilling_sponsorUserId_idx" ON "SponsorshipBilling"("sponsorUserId");

-- CreateIndex
CREATE INDEX "SponsorshipBilling_sponsorshipId_idx" ON "SponsorshipBilling"("sponsorshipId");

-- CreateIndex
CREATE INDEX "SponsorshipBilling_status_idx" ON "SponsorshipBilling"("status");

-- CreateIndex
CREATE INDEX "SponsorshipBilling_billingPeriodStart_idx" ON "SponsorshipBilling"("billingPeriodStart");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPackage_revenueCatProductId_key" ON "CreditPackage"("revenueCatProductId");

-- CreateIndex
CREATE INDEX "CreditPackage_isActive_idx" ON "CreditPackage"("isActive");

-- CreateIndex
CREATE INDEX "CreditPackage_sortOrder_idx" ON "CreditPackage"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPurchase_revenueCatTransactionId_key" ON "CreditPurchase"("revenueCatTransactionId");

-- CreateIndex
CREATE INDEX "CreditPurchase_userId_idx" ON "CreditPurchase"("userId");

-- CreateIndex
CREATE INDEX "CreditPurchase_organizationId_idx" ON "CreditPurchase"("organizationId");

-- CreateIndex
CREATE INDEX "CreditPurchase_subscriptionId_idx" ON "CreditPurchase"("subscriptionId");

-- CreateIndex
CREATE INDEX "CreditPurchase_status_idx" ON "CreditPurchase"("status");

-- CreateIndex
CREATE INDEX "CreditPurchase_purchasedAt_idx" ON "CreditPurchase"("purchasedAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_organizationId_idx" ON "CreditTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "CreditTransaction_subscriptionId_idx" ON "CreditTransaction"("subscriptionId");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscriptionSponsorship" ADD CONSTRAINT "EmployeeSubscriptionSponsorship_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscriptionSponsorship" ADD CONSTRAINT "EmployeeSubscriptionSponsorship_sponsorUserId_fkey" FOREIGN KEY ("sponsorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscriptionSponsorship" ADD CONSTRAINT "EmployeeSubscriptionSponsorship_sponsoredUserId_fkey" FOREIGN KEY ("sponsoredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSubscriptionSponsorship" ADD CONSTRAINT "EmployeeSubscriptionSponsorship_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipBilling" ADD CONSTRAINT "SponsorshipBilling_sponsorshipId_fkey" FOREIGN KEY ("sponsorshipId") REFERENCES "EmployeeSubscriptionSponsorship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_creditPackageId_fkey" FOREIGN KEY ("creditPackageId") REFERENCES "CreditPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
