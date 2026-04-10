// POST /api/capture
//
// Email capture for the weekly Orbit digest. Anonymous by default — the
// payload may optionally include the current signal so the first digest
// can reference where the traveller started.
//
// Request body:
//   {
//     "email": "you@example.com",
//     "source"?: "orbit_perspective",
//     "signalAtCapture"?: 67,
//     "monthlyTCO2e"?: 0.42,
//     "consent": true
//   }

import { NextResponse } from "next/server";
import { z } from "zod";
import { captureEmail, isValidEmail } from "@/lib/orbit/capture";
import { DEFAULT_HANDLE, getOrCreateTraveller } from "@/lib/orbit/data";

const PayloadSchema = z.object({
  email: z.string().min(3).max(254),
  source: z.string().max(64).optional(),
  signalAtCapture: z.number().int().min(0).max(100).optional(),
  monthlyTCO2e: z.number().min(0).max(100).optional(),
  consent: z.boolean()
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, source, signalAtCapture, monthlyTCO2e, consent } = parsed.data;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json(
      { error: "Consent is required to subscribe" },
      { status: 400 }
    );
  }

  // Attach the current solo traveller if we have one, so future digests
  // can reference the rest of their orbit data. Safe to no-op on failure.
  let travellerId: string | null = null;
  try {
    const traveller = await getOrCreateTraveller(DEFAULT_HANDLE);
    travellerId = traveller.id;
  } catch {
    travellerId = null;
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 240) ?? null;

  try {
    const result = await captureEmail({
      email,
      source,
      signalAtCapture,
      monthlyTCO2e,
      consent,
      travellerId,
      userAgent
    });
    return NextResponse.json(
      {
        id: result.id,
        email: result.email,
        syncStatus: result.syncStatus
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "INVALID_EMAIL") {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (message === "CONSENT_REQUIRED") {
      return NextResponse.json(
        { error: "Consent is required to subscribe" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}
