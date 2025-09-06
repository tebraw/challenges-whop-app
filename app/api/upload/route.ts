// app/api/upload/route.ts
import { NextResponse } from "next/server";
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

    if (file.size > 10 * 1024 * 1024) {
      return new NextResponse("File too large (>10MB)", { status: 413 });
    }

    if (!file.type.startsWith('image/')) {
      return new NextResponse("File must be an image", { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    // For small images, use data URLs (safer for mobile)
    if (file.size < 500 * 1024) { // 500KB limit for data URLs to prevent mobile crashes
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ 
        url: dataUrl,
        method: 'data-url',
        size: file.size,
        type: mimeType
      });
    }

    // For larger images, try external services
    const fileName = `challenge-${randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;

    // Try postimages.org (free service, no API key needed)
    try {
      const formData = new FormData();
      formData.append('upload', file);
      formData.append('optsize', '0'); // Keep original size
      formData.append('expire', '0'); // Never expire

      const postImagesResponse = await fetch('https://postimg.cc/json', {
        method: 'POST',
        body: formData
      });

      if (postImagesResponse.ok) {
        const data = await postImagesResponse.json();
        if (data.status === 'OK' && data.url) {
          return NextResponse.json({ 
            url: data.url,
            method: 'postimages',
            size: file.size,
            type: mimeType
          });
        }
      }
    } catch (error) {
      console.log('postimages.org failed, trying alternatives...');
    }

    // Try imgur as backup (if client ID is available)
    if (process.env.IMGUR_CLIENT_ID) {
      try {
        const imgurResponse = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `image=${encodeURIComponent(base64)}&type=base64&name=${fileName}`
        });

        if (imgurResponse.ok) {
          const imgurData = await imgurResponse.json();
          if (imgurData.success && imgurData.data?.link) {
            return NextResponse.json({ 
              url: imgurData.data.link,
              method: 'imgur',
              size: file.size,
              type: mimeType
            });
          }
        }
      } catch (error) {
        console.log('imgur failed...');
      }
    }

    // Final fallback: Use data URL even for larger images 
    // (might be slow but will show the actual image)
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return NextResponse.json({ 
      url: dataUrl,
      method: 'data-url-fallback',
      size: file.size,
      type: mimeType,
      warning: 'Large image using data URL - consider compressing'
    });

  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);
    return new NextResponse(`Upload failed: ${e.message}`, { status: 500 });
  }
}
