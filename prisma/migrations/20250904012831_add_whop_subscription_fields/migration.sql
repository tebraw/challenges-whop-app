-- CreateTable
CREATE TABLE "ChallengeWinner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "selectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeWinner_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "proofType" TEXT NOT NULL DEFAULT 'NONE',
    "cadence" TEXT NOT NULL DEFAULT 'DAILY',
    "rules" JSONB,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT,
    "whopCreatorId" TEXT,
    "whopCategoryId" TEXT,
    "whopCategoryName" TEXT,
    "whopTags" JSONB,
    "monetizationRules" JSONB,
    "targetAudience" JSONB,
    "marketingTags" JSONB,
    CONSTRAINT "Challenge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("cadence", "createdAt", "description", "endAt", "id", "imageUrl", "proofType", "rules", "startAt", "tenantId", "title") SELECT "cadence", "createdAt", "description", "endAt", "id", "imageUrl", "proofType", "rules", "startAt", "tenantId", "title" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE TABLE "new_ChallengeOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "whopProductId" TEXT NOT NULL,
    "offerType" TEXT NOT NULL,
    "discountPercentage" INTEGER,
    "discountAmount" REAL,
    "originalPrice" REAL NOT NULL,
    "discountedPrice" REAL NOT NULL,
    "timeLimit" INTEGER,
    "triggerConditions" TEXT,
    "customMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChallengeOffer_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeOffer_whopProductId_fkey" FOREIGN KEY ("whopProductId") REFERENCES "WhopProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChallengeOffer" ("challengeId", "createdAt", "customMessage", "discountAmount", "discountPercentage", "discountedPrice", "id", "isActive", "offerType", "originalPrice", "timeLimit", "triggerConditions", "updatedAt", "whopProductId") SELECT "challengeId", "createdAt", "customMessage", "discountAmount", "discountPercentage", "discountedPrice", "id", "isActive", "offerType", "originalPrice", "timeLimit", "triggerConditions", "updatedAt", "whopProductId" FROM "ChallengeOffer";
DROP TABLE "ChallengeOffer";
ALTER TABLE "new_ChallengeOffer" RENAME TO "ChallengeOffer";
CREATE INDEX "ChallengeOffer_challengeId_idx" ON "ChallengeOffer"("challengeId");
CREATE TABLE "new_OfferConversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeOfferId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "conversionType" TEXT NOT NULL,
    "whopCheckoutUrl" TEXT,
    "revenue" REAL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferConversion_challengeOfferId_fkey" FOREIGN KEY ("challengeOfferId") REFERENCES "ChallengeOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfferConversion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OfferConversion" ("challengeId", "challengeOfferId", "conversionType", "createdAt", "id", "metadata", "revenue", "userId", "whopCheckoutUrl") SELECT "challengeId", "challengeOfferId", "conversionType", "createdAt", "id", "metadata", "revenue", "userId", "whopCheckoutUrl" FROM "OfferConversion";
DROP TABLE "OfferConversion";
ALTER TABLE "new_OfferConversion" RENAME TO "OfferConversion";
CREATE INDEX "OfferConversion_challengeId_idx" ON "OfferConversion"("challengeId");
CREATE INDEX "OfferConversion_userId_idx" ON "OfferConversion"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "whopUserId" TEXT,
    "whopAffiliateLink" TEXT,
    "whopCompanyId" TEXT,
    "isFreeTier" BOOLEAN NOT NULL DEFAULT true,
    "membershipId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "tier" TEXT NOT NULL DEFAULT 'free',
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "role", "tenantId") SELECT "createdAt", "email", "id", "name", "role", "tenantId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_whopUserId_key" ON "User"("whopUserId");
CREATE TABLE "new_WhopProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whopProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "productType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "checkoutUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "whopCreatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhopProduct_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WhopProduct" ("checkoutUrl", "createdAt", "creatorId", "currency", "description", "id", "imageUrl", "isActive", "name", "price", "productType", "updatedAt", "whopCreatorId", "whopProductId") SELECT "checkoutUrl", "createdAt", "creatorId", "currency", "description", "id", "imageUrl", "isActive", "name", "price", "productType", "updatedAt", "whopCreatorId", "whopProductId" FROM "WhopProduct";
DROP TABLE "WhopProduct";
ALTER TABLE "new_WhopProduct" RENAME TO "WhopProduct";
CREATE UNIQUE INDEX "WhopProduct_whopProductId_key" ON "WhopProduct"("whopProductId");
CREATE INDEX "WhopProduct_creatorId_idx" ON "WhopProduct"("creatorId");
CREATE INDEX "WhopProduct_whopCreatorId_idx" ON "WhopProduct"("whopCreatorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ChallengeWinner_challengeId_idx" ON "ChallengeWinner"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeWinner_challengeId_place_key" ON "ChallengeWinner"("challengeId", "place");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeWinner_challengeId_userId_key" ON "ChallengeWinner"("challengeId", "userId");
