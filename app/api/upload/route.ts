// app/api/upload/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Set explicit size limits for this API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
}

// Ping: http://localhost:3000/api/upload
export async function GET() {
  return NextResponse.json({ ok: true, message: "upload route alive" });
}

export async function POST(req: Request) {
  try {
    console.log('Upload request received');
    
    // Check content length before processing
    const contentLength = req.headers.get('content-length');
    console.log('Content-Length:', contentLength);
    
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      console.log('Request too large:', contentLength);
      return new NextResponse("Request too large (>50MB)", { status: 413 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      console.log('No file provided');
      return new NextResponse("No file", { status: 400 });
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (file.size > 50 * 1024 * 1024) {
      console.log('File too large:', file.size);
      return new NextResponse("File too large (>50MB)", { status: 413 });
    }

    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return new NextResponse("File must be an image", { status: 400 });
    }

    // Convert file to base64 without any compression
    console.log('Converting to base64...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    // Always use data URLs for proof images to avoid compression
    // This ensures the original image quality is preserved
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    console.log('Upload successful:', {
      size: file.size,
      base64Length: base64.length,
      type: mimeType
    });
    
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
    console.error("Error stack:", e.stack);
    return new NextResponse(`Upload failed: ${e.message}`, { status: 500 });
  }
}
