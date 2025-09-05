"use server";
import { headers } from "next/headers";
import { verifyUserToken, whopSdk } from "./whop-sdk";

export async function getWhopUserFromHeaders() {
  const h = await headers();
  const tokenInfo = await verifyUserToken(h);
  if (!tokenInfo?.userId) return null;
  return tokenInfo; // { userId, companyId?, ... }
}

export async function ensureExperienceAccess(experienceId: string) {
  const h = await headers();
  const tokenInfo = await verifyUserToken(h);
  if (!tokenInfo?.userId) return { ok: false, reason: "unauthorized" };

  const res = await whopSdk.access.checkIfUserHasAccessToExperience({
    userId: tokenInfo.userId,
    experienceId,
  });

  return { ok: !!res?.hasAccess, reason: res?.hasAccess ? undefined : "no_access" };
}
