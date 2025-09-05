import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const src = await prisma.challenge.findUnique({ where: { id } });
    if (!src) return new NextResponse("Not found", { status: 404 });

    const dur = new Date(src.endAt).getTime() - new Date(src.startAt).getTime();
    const start = new Date(Date.now() + 10 * 60 * 1000); // +10 min
    const end = new Date(start.getTime() + Math.max(dur, 24 * 60 * 60 * 1000)); // min. 1 Tag

    const copy = await prisma.challenge.create({
      data: {
        tenantId: src.tenantId,
        title: `${src.title} (Kopie)`,
        description: src.description,
        startAt: start,
        endAt: end,
        proofType: src.proofType,
        imageUrl: src.imageUrl || (src.rules as any)?.imageUrl || '', // Copy imageUrl from top-level or rules
        ...(src.rules && { rules: JSON.parse(JSON.stringify(src.rules)) }),
      },
    });

    return NextResponse.json({ id: copy.id }, { status: 201 });
  } catch (e: any) {
    console.error("CHALLENGE DUPLICATE ERROR:", e);
    return new NextResponse(e?.message || "Duplicate failed", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
