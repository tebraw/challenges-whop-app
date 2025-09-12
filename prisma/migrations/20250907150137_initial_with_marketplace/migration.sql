-- CreateEnum
CREATE TYPE "public"."Cadence" AS ENUM ('DAILY', 'END_OF_CHALLENGE');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ProofType" AS ENUM ('NONE', 'TEXT', 'PHOTO', 'LINK');

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whopCompanyId" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "whopUserId" TEXT,
    "whopAffiliateLink" TEXT,
    "whopCompanyId" TEXT,
    "isFreeTier" BOOLEAN NOT NULL DEFAULT true,
    "membershipId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "tier" TEXT NOT NULL DEFAULT 'free',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "proofType" "public"."ProofType" NOT NULL DEFAULT 'NONE',
    "cadence" "public"."Cadence" NOT NULL DEFAULT 'DAILY',
    "rules" JSONB,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT,
    "whopCreatorId" TEXT,
    "whopCategoryId" TEXT,
    "whopCategoryName" TEXT,
    "whopTags" JSONB,
    "monetizationRules" JSONB,
    "targetAudience" JSONB,
    "marketingTags" JSONB,
    "category" TEXT DEFAULT 'general',
    "difficulty" TEXT DEFAULT 'BEGINNER',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhopProduct" (
    "id" TEXT NOT NULL,
    "whopProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "productType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "checkoutUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "whopCreatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhopProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeOffer" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "whopProductId" TEXT NOT NULL,
    "offerType" TEXT NOT NULL,
    "discountPercentage" INTEGER,
    "discountAmount" DOUBLE PRECISION,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "discountedPrice" DOUBLE PRECISION NOT NULL,
    "timeLimit" INTEGER,
    "triggerConditions" TEXT,
    "customMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OfferConversion" (
    "id" TEXT NOT NULL,
    "challengeOfferId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "conversionType" TEXT NOT NULL,
    "whopCheckoutUrl" TEXT,
    "revenue" DOUBLE PRECISION,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proof" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "type" "public"."ProofType" NOT NULL,
    "url" TEXT,
    "text" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Checkin" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeWinner" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_whopCompanyId_key" ON "public"."Tenant"("whopCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_whopUserId_key" ON "public"."User"("whopUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WhopProduct_whopProductId_key" ON "public"."WhopProduct"("whopProductId");

-- CreateIndex
CREATE INDEX "WhopProduct_creatorId_idx" ON "public"."WhopProduct"("creatorId");

-- CreateIndex
CREATE INDEX "WhopProduct_whopCreatorId_idx" ON "public"."WhopProduct"("whopCreatorId");

-- CreateIndex
CREATE INDEX "ChallengeOffer_challengeId_idx" ON "public"."ChallengeOffer"("challengeId");

-- CreateIndex
CREATE INDEX "OfferConversion_challengeId_idx" ON "public"."OfferConversion"("challengeId");

-- CreateIndex
CREATE INDEX "OfferConversion_userId_idx" ON "public"."OfferConversion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_challengeId_userId_key" ON "public"."Enrollment"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "Proof_enrollmentId_isActive_idx" ON "public"."Proof"("enrollmentId", "isActive");

-- CreateIndex
CREATE INDEX "ChallengeWinner_challengeId_idx" ON "public"."ChallengeWinner"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeWinner_challengeId_place_key" ON "public"."ChallengeWinner"("challengeId", "place");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeWinner_challengeId_userId_key" ON "public"."ChallengeWinner"("challengeId", "userId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhopProduct" ADD CONSTRAINT "WhopProduct_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeOffer" ADD CONSTRAINT "ChallengeOffer_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeOffer" ADD CONSTRAINT "ChallengeOffer_whopProductId_fkey" FOREIGN KEY ("whopProductId") REFERENCES "public"."WhopProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferConversion" ADD CONSTRAINT "OfferConversion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferConversion" ADD CONSTRAINT "OfferConversion_challengeOfferId_fkey" FOREIGN KEY ("challengeOfferId") REFERENCES "public"."ChallengeOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferConversion" ADD CONSTRAINT "OfferConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proof" ADD CONSTRAINT "Proof_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Checkin" ADD CONSTRAINT "Checkin_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeWinner" ADD CONSTRAINT "ChallengeWinner_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeWinner" ADD CONSTRAINT "ChallengeWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
