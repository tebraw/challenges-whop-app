import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: challengeId } = await context.params;
    const rows = await prisma.checkin.groupBy({
      by: ["enrollmentId"],
      _count: { enrollmentId: true },
      where: { enrollment: { challengeId } },
      orderBy: { _count: { enrollmentId: "desc" } },
      take: 20,
    });

    // enrollmentId -> userId with user details
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const enrollment = await prisma.enrollment.findUnique({ 
          where: { id: r.enrollmentId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
              }
            }
          }
        });
        const count = typeof r._count === "object" && r._count !== null ? r._count.enrollmentId ?? 0 : 0;
        return { 
          userId: enrollment?.user?.id || "-", 
          userEmail: enrollment?.user?.email || "",
          userName: enrollment?.user?.name || "",
          userCreatedAt: enrollment?.user?.createdAt || null,
          count,
          enrollmentId: r.enrollmentId
        };
      })
    );

    return NextResponse.json({ ok: true, rows: enriched });
  } catch (e: any) {
    console.error("leaderboard", e);
    return NextResponse.json({ ok: false, message: e?.message || "Fehler" }, { status: 500 });
  }
}
