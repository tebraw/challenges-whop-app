
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProofRules, validateCheckinRules } from "@/lib/challengeRules";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id: challengeId } = params;
  let body: any = {};
  
  try {
    body = await req.json();
    console.log("Proof API - Received body:", JSON.stringify(body, null, 2));
    
    // User aus Cookie 'as' auslesen, fallback demo-user
    const { cookies } = await import("next/headers");
    const userId = (await cookies()).get("as")?.value || "demo-user";
    console.log("Proof API - User ID:", userId);
    
    // Hole Enrollment für User und Challenge mit bestehenden Check-ins und Proofs
    const enrollment = await prisma.enrollment.findFirst({
      where: { challengeId, userId },
      include: {
        checkins: true,
        proofs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    console.log("Proof API - Enrollment found:", !!enrollment);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment nicht gefunden" }, { status: 404 });
    }
    
    // Hole Challenge mit allen relevanten Feldern
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { 
        cadence: true, 
        startAt: true, 
        endAt: true,
        rules: true
      },
    });
    console.log("Proof API - Challenge found:", !!challenge, "Cadence:", challenge?.cadence, "Rules:", challenge?.rules);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge nicht gefunden" }, { status: 404 });
    }

    // Extrahiere die echte Cadence aus den rules (falls dort gespeichert)
    const rules = challenge.rules as any;
    const actualCadence = rules?.cadence === "END" ? "END_OF_CHALLENGE" : 
                         rules?.cadence === "END_OF_CHALLENGE" ? "END_OF_CHALLENGE" :
                         challenge.cadence === "END_OF_CHALLENGE" ? "END_OF_CHALLENGE" : "DAILY";
    
    const challengeForValidation = { ...challenge, cadence: actualCadence as any };
    console.log("Proof API - Using cadence:", actualCadence);
    
    // Validiere Proof-Regeln mit der importierten Funktion
    console.log("Proof API - Validating proof rules...");
    const proofValidation = validateProofRules(
      challengeForValidation, 
      { id: enrollment.id }, 
      enrollment.proofs, 
      new Date()
    );
    console.log("Proof API - Proof validation result:", proofValidation);
    
    if (!proofValidation.canSubmitProof) {
      console.log("Proof API - Proof submission not allowed:", proofValidation.reason);
      return NextResponse.json({ 
        error: proofValidation.reason || "Proof-Einreichung nicht erlaubt" 
      }, { status: 400 });
    }
    
    // Validiere Check-in-Regeln - aber für END_OF_CHALLENGE während der Challenge anders behandeln
    console.log("Proof API - Validating checkin rules...");
    let checkinValidation;
    
    if (actualCadence === "END_OF_CHALLENGE") {
      // Für END_OF_CHALLENGE: Checkin-Validierung ist relaxed während der Challenge
      const now = new Date().getTime();
      const endTime = new Date(challenge.endAt).getTime();
      
      if (now < endTime) {
        // Während der Challenge: Check-in erlauben für Proof-Upload
        checkinValidation = {
          canCheckin: true,
          reason: "Check-in allowed during challenge for proof upload"
        };
      } else {
        // Nach der Challenge: Normale Check-in Validierung
        checkinValidation = validateCheckinRules(
          challengeForValidation, 
          { id: enrollment.id }, 
          enrollment.checkins, 
          new Date()
        );
      }
    } else {
      // Für andere Cadences: Normale Check-in Validierung
      checkinValidation = validateCheckinRules(
        challengeForValidation, 
        { id: enrollment.id }, 
        enrollment.checkins, 
        new Date()
      );
    }
    
    console.log("Proof API - Checkin validation result:", checkinValidation);
    
    if (!checkinValidation.canCheckin) {
      console.log("Proof API - Checkin not allowed:", checkinValidation.reason);
      return NextResponse.json({ 
        error: checkinValidation.reason || "Check-in nicht erlaubt" 
      }, { status: 400 });
    }
    // END_OF_CHALLENGE: Proof-Logik mit vereinfachter Validierung
    if (actualCadence === "END_OF_CHALLENGE") {
      // Hole existierende aktive Proofs
      const existingProof = await prisma.proof.findFirst({
        where: {
          enrollmentId: enrollment.id,
          isActive: true,
        },
      });
      
      let version = 1;
      if (existingProof) {
        // Deaktiviere alten Proof (Versionierung)
        await prisma.proof.update({
          where: { id: existingProof.id },
          data: { isActive: false },
        });
        version = existingProof.version + 1;
      }
      
      // Erstelle neuen Proof
      const newProof = await prisma.proof.create({
        data: {
          enrollmentId: enrollment.id,
          type: body.type === "FILE" ? "PHOTO" : body.type,
          url: body.mediaUrl || body.url || null,
          text: body.text || null,
          version,
          isActive: true,
        },
      });

      // Check-in-Logik: Immer nur ein Check-in pro Enrollment
      const checkinData: any = {};
      if (body.type === "FILE") checkinData.imageUrl = body.mediaUrl ?? null;
      if (body.type === "TEXT")  checkinData.text = body.text ?? null;
      if (body.type === "LINK")  checkinData.linkUrl = body.url ?? null;
      
      // Validiere, dass mindestens ein Inhalt vorhanden ist
      const hasContent = (body.type === "FILE" && body.mediaUrl) ||
                        (body.type === "TEXT" && body.text && body.text.trim()) ||
                        (body.type === "LINK" && body.url && body.url.trim());
      
      if (!hasContent) {
        return NextResponse.json({ 
          error: "Please add content to your check-in (text, photo or link)" 
        }, { status: 400 });
      }
      
      let checkinResult;
      if (checkinValidation.existingTodayCheckin) {
        // Update existing check-in
        checkinResult = await prisma.checkin.update({ 
          where: { id: checkinValidation.existingTodayCheckin.id }, 
          data: checkinData 
        });
      } else {
        // Create new check-in
        checkinResult = await prisma.checkin.create({ 
          data: { enrollmentId: enrollment.id, ...checkinData } 
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        proof: newProof, 
        checkin: checkinResult,
        message: existingProof 
          ? "File replaced. Only the last file counts for the challenge." 
          : "Proof and check-in successfully saved",
        wasReplaced: !!existingProof
      });
    }
    // DAILY Challenge: Extended daily logic with proof replacement
    if (actualCadence === "DAILY") {
      const checkinData: any = {};
      if (body.type === "FILE") checkinData.imageUrl = body.mediaUrl ?? null;
      if (body.type === "TEXT")  checkinData.text = body.text ?? null;
      if (body.type === "LINK")  checkinData.linkUrl = body.url ?? null;
      
      // Validiere, dass mindestens ein Inhalt vorhanden ist
      const hasContent = (body.type === "FILE" && body.mediaUrl) ||
                        (body.type === "TEXT" && body.text && body.text.trim()) ||
                        (body.type === "LINK" && body.url && body.url.trim());
      
      if (!hasContent) {
        return NextResponse.json({ 
          error: "Please add content to your check-in (text, photo or link)" 
        }, { status: 400 });
      }
      
      // Check for existing today's proof for DAILY
      const existingTodayProof = proofValidation.existingProof;
      let newProof;
      let proofVersion = 1;
      
      if (existingTodayProof) {
        // Deaktiviere den alten Proof (Daily: pro Tag nur ein aktiver Proof)
        await prisma.proof.update({
          where: { id: existingTodayProof.id },
          data: { isActive: false },
        });
        proofVersion = existingTodayProof.version + 1;
      }
      
      // Create new proof for today
      newProof = await prisma.proof.create({
        data: {
          enrollmentId: enrollment.id,
          type: body.type === "FILE" ? "PHOTO" : body.type,
          url: body.mediaUrl || body.url || null,
          text: body.text || null,
          version: proofVersion,
          isActive: true,
        },
      });
      
      let checkinResult;
      if (checkinValidation.existingTodayCheckin) {
        // Aktualisiere heutigen Check-in
        checkinResult = await prisma.checkin.update({
          where: { id: checkinValidation.existingTodayCheckin.id },
          data: checkinData,
        });
        
        return NextResponse.json({ 
          success: true, 
          updated: true, 
          checkin: checkinResult,
          proof: newProof,
          message: existingTodayProof 
            ? "Today's file was replaced. You can only upload once per day." 
            : "Today's check-in was updated",
          wasReplaced: !!existingTodayProof
        });
      } else {
        // Create new check-in for today
        checkinResult = await prisma.checkin.create({
          data: {
            enrollmentId: enrollment.id,
            ...checkinData
          },
        });
        
        return NextResponse.json({ 
          success: true, 
          created: true, 
          checkin: checkinResult,
          proof: newProof,
          message: "Check-in und Proof erfolgreich erstellt",
          wasReplaced: false
        });
      }
    }
    
    return NextResponse.json({ 
      error: "Unbekannte Challenge-Cadence" 
    }, { status: 400 });

  } catch (error) {
    console.error("Proof API Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'Unknown error');
    console.error("Request body was:", body);
    return NextResponse.json({ 
      error: "Upload fehlgeschlagen", 
      details: error instanceof Error ? error.message : "Unbekannter Fehler"
    }, { status: 500 });
  }
}
