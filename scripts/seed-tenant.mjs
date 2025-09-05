// scripts/seed-tenant.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";
const TENANT_NAME = "Demo";

try {
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: { id: TENANT_ID, name: TENANT_NAME },
  });
  console.log(`✅ Tenant vorhanden: ${TENANT_ID}`);
} catch (e) {
  console.error("❌ Seed-Fehler:", e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
