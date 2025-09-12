import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string; challengeId: string }> }
) {
  try {
    const { userId, challengeId } = await context.params;
    
    console.log("Simple test route accessed with params:", { userId, challengeId });
    
    return NextResponse.json({
      ok: true,
      message: "Simple test route is working",
      params: { userId, challengeId },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Simple route error:", error);
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}