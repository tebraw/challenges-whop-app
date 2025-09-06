// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Ping: http://localhost:3000/api/upload
export async function GET() {
  return NextResponse.json({ ok: true, message: "upload route alive" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return new NextResponse("No file", { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File too large (>5MB)", { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name || "") || ".bin";
    const name = `${randomUUID()}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, name);
    await fs.writeFile(fullPath, buffer);

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);
    return new NextResponse(e?.message || "Upload failed", { status: 500 });
  }
}
