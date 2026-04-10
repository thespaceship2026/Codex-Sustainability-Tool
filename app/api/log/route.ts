// POST /api/log
//
// Record a quick-log entry from the floating dock. Returns the created
// entry so the client can prepend it to the observation log optimistically.
//
// Request body:
//   { "kind": "flight" | "meal" | "energy" | "trip", "body"?: string,
//     "valueLabel"?: string }

import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_HANDLE, getOrCreateTraveller } from "@/lib/orbit/data";
import { quickLog } from "@/lib/orbit/actions";

const PayloadSchema = z.object({
  kind: z.enum(["flight", "meal", "energy", "trip"]),
  label: z.string().max(120).optional(),
  body: z.string().max(500).optional(),
  valueLabel: z.string().max(60).optional()
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const traveller = await getOrCreateTraveller(DEFAULT_HANDLE);
  const entry = await quickLog(traveller.id, parsed.data);

  return NextResponse.json(entry, { status: 200 });
}
