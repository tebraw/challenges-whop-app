import { NextResponse } from "next/server";

export async function GET() {
  console.log("Test route accessed successfully");
  return NextResponse.json({
    ok: true,
    message: "Test route is working",
    timestamp: new Date().toISOString()
  });
}
