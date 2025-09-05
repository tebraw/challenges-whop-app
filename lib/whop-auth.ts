"use server";
import { headers } from "next/headers";
import { verifyUserToken, whopSdk } from "./whop-sdk";

export async function getWhopUserFromHeaders() {
  const h = await headers();
  const authHeader = h.get('authorization') || '';
  const tokenInfo = await verifyUserToken(authHeader);
  if (!tokenInfo?.userId) return null;
  return tokenInfo; // { userId, companyId?, ... }
}

export async function ensureExperienceAccess(experienceId: string) {
  const h = await headers();
  const authHeader = h.get('authorization') || '';
  const tokenInfo = await verifyUserToken(authHeader);
  if (!tokenInfo?.userId) return { ok: false, reason: "unauthorized" };

  // TODO: Update when Whop SDK is properly configured
  // const res = await whopSdk.access.checkIfUserHasAccessToExperience({
  //   userId: tokenInfo.userId,
  //   experienceId,
  // });

  // Temporary fallback for deployment
  return { ok: true, reason: "temp_access_granted" };
}
