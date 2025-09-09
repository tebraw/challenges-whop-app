// app/api/upload/route.ts
import { NextResponse } from "next/server";

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

    if (file.size > 10 * 1024 * 1024) {
      return new NextResponse("File too large (>10MB)", { status: 413 });
    }

    if (!file.type.startsWith('image/')) {
      return new NextResponse("File must be an image", { status: 400 });
    }

    // Convert file to base64 without any compression
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    // Always use data URLs for proof images to avoid compression
    // This ensures the original image quality is preserved
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return NextResponse.json({ 
      url: dataUrl,
      method: 'data-url-original',
      size: file.size,
      type: mimeType,
      compressed: false,
      message: 'Image uploaded without compression'
    });

  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);
    return new NextResponse(`Upload failed: ${e.message}`, { status: 500 });
  }
}
