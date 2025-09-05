"use server";

import { WhopApi, makeUserTokenVerifier, makeWebhookValidator } from "@whop/api";

export const whopSdk = WhopApi({
  appApiKey: process.env.WHOP_API_KEY ?? "",
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // optional
});

export const verifyUserToken = makeUserTokenVerifier({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "",
  dontThrow: true,
});

export const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "",
});
