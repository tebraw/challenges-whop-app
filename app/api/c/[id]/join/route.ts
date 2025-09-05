import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
const prisma = new PrismaClient();

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: challengeId } = await context.params;
    const userId = (await cookies()).get("as")?.value || "demo-user";

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ ok: false, message: "Challenge nicht gefunden." }, { status: 404 });

    // User sicherstellen
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@example.com`,
        name: userId,
        role: "USER",
        tenant: { connect: { id: "demo-tenant" } } // Replace "demo-tenant" with a valid tenant id
      },
    });

    await prisma.enrollment.upsert({
      where: { challengeId_userId: { challengeId, userId } },
      update: {},
      create: { challengeId, userId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("join", e);
    return NextResponse.json({ ok: false, message: e?.message || "Fehler" }, { status: 500 });
  }
}
