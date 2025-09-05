-- Add multi-tenant support to existing database
-- Run this on production database

-- Add whopCompanyId to Tenant table
ALTER TABLE "Tenant" ADD COLUMN "whopCompanyId" TEXT;

-- Add unique constraint
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_whopCompanyId_key" UNIQUE ("whopCompanyId");

-- Create index for performance
CREATE INDEX "Tenant_whopCompanyId_idx" ON "Tenant"("whopCompanyId");

-- Optional: Update existing tenants (if any) with a default value
-- UPDATE "Tenant" SET "whopCompanyId" = 'legacy_' || id WHERE "whopCompanyId" IS NULL;
