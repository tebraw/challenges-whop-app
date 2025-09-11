-- Migration: Add Whop handle and product ID fields for URL optimization
-- Based on analysis of whop.com/discover/appmafia/?productId=... pattern

-- Add new fields to Tenant model for better URL generation
ALTER TABLE "Tenant" ADD COLUMN "whopHandle" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "whopProductId" TEXT;

-- Add unique constraint on whopHandle to prevent duplicates
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_whopHandle_key" UNIQUE ("whopHandle");

-- Update existing tenants with inferred handles where possible
-- This is safe to run multiple times
UPDATE "Tenant" 
SET "whopHandle" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]', '', 'g'))
WHERE "whopHandle" IS NULL 
  AND "name" IS NOT NULL 
  AND LENGTH(REGEXP_REPLACE("name", '[^a-zA-Z0-9]', '', 'g')) >= 3;

-- Note: Real handles should be fetched from Whop API during tenant creation
-- This is just a fallback for existing data