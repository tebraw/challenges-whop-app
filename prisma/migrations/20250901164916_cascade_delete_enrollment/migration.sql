-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Checkin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    CONSTRAINT "Checkin_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Checkin" ("createdAt", "enrollmentId", "id", "imageUrl", "linkUrl", "text") SELECT "createdAt", "enrollmentId", "id", "imageUrl", "linkUrl", "text" FROM "Checkin";
DROP TABLE "Checkin";
ALTER TABLE "new_Checkin" RENAME TO "Checkin";
CREATE TABLE "new_Proof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "text" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proof_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Proof" ("createdAt", "enrollmentId", "id", "isActive", "text", "type", "updatedAt", "url", "version") SELECT "createdAt", "enrollmentId", "id", "isActive", "text", "type", "updatedAt", "url", "version" FROM "Proof";
DROP TABLE "Proof";
ALTER TABLE "new_Proof" RENAME TO "Proof";
CREATE INDEX "Proof_enrollmentId_isActive_idx" ON "Proof"("enrollmentId", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
