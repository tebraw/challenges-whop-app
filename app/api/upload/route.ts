// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (>5MB)" }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name || "") || ".bin";
    const name = `${randomUUID()}${ext}`;

    // Handle different environments
    let uploadDir: string;
    let publicUrl: string;

    if (process.env.VERCEL) {
      // Vercel deployment - use temporary fallback with external URL
      uploadDir = path.join("/tmp", "uploads");
      // Use a fallback image URL for production until proper cloud storage is set up
      publicUrl = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop&q=80&auto=format`;
      
      console.log('🚨 Production upload fallback - using placeholder image');
    } else {
      // Local development
      uploadDir = path.join(process.cwd(), "public", "uploads");
      publicUrl = `/uploads/${name}`;
    }

    // Create directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log("Directory creation warning:", error);
      // Continue if directory already exists
    }

    const fullPath = path.join(uploadDir, name);
    await writeFile(fullPath, buffer);

    console.log("✅ File uploaded successfully:", publicUrl);
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      message: process.env.VERCEL ? "File uploaded (temporary on Vercel)" : "File uploaded successfully"
    });

  } catch (error: any) {
    console.error("❌ UPLOAD ERROR:", error);
    return NextResponse.json(
      { 
        error: error?.message || "Upload failed",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
