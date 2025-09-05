-- CreateTable
CREATE TABLE "WhopProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whopProductId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "productType" TEXT NOT NULL, -- 'course', 'coaching', 'membership', 'community'
    "imageUrl" TEXT,
    "checkoutUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "whopCreatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "ChallengeOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "whopProductId" TEXT NOT NULL,
    "offerType" TEXT NOT NULL, -- 'completion', 'high_engagement', 'mid_challenge'
    "discountPercentage" INTEGER,
    "discountAmount" REAL,
    "originalPrice" REAL NOT NULL,
    "discountedPrice" REAL NOT NULL,
    "timeLimit" INTEGER, -- Hours the offer is valid
    "triggerConditions" TEXT, -- JSON string with conditions
    "customMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("whopProductId") REFERENCES "WhopProduct" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "OfferConversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeOfferId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "conversionType" TEXT NOT NULL, -- 'view', 'click', 'purchase'
    "whopCheckoutUrl" TEXT,
    "revenue" REAL,
    "metadata" TEXT, -- JSON for additional tracking data
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("challengeOfferId") REFERENCES "ChallengeOffer" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "WhopProduct_creatorId_idx" ON "WhopProduct"("creatorId");
CREATE INDEX "WhopProduct_whopCreatorId_idx" ON "WhopProduct"("whopCreatorId");
CREATE INDEX "ChallengeOffer_challengeId_idx" ON "ChallengeOffer"("challengeId");
CREATE INDEX "OfferConversion_challengeId_idx" ON "OfferConversion"("challengeId");
CREATE INDEX "OfferConversion_userId_idx" ON "OfferConversion"("userId");
