-- Migration: Add experienceId support for Whop Experience-based data scoping
-- This aligns with Whop rule #1: "Experience ist dein Mandant"

-- Add experienceId column to Challenge table
ALTER TABLE "Challenge" ADD COLUMN "experienceId" TEXT;

-- Add experienceId column to User table
ALTER TABLE "User" ADD COLUMN "experienceId" TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "Challenge_experienceId_idx" ON "Challenge"("experienceId");
CREATE INDEX IF NOT EXISTS "User_experienceId_idx" ON "User"("experienceId");

-- For existing data, we'll migrate in the application code
-- Since tenantId is currently mapped to company, we can derive experienceId from that
