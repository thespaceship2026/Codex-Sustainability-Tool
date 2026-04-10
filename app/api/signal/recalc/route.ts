// POST /api/signal/recalc
//
// Recompute the signal from scratch using every answer on file. Useful
// after an emission-factor update, or as a "nothing changed on the client
// but I want the latest number" refresh. Returns the new SignalView.

import { NextResponse } from "next/server";
import { DEFAULT_HANDLE, loadOrbitSnapshot } from "@/lib/orbit/data";

export async function POST() {
  const snapshot = await loadOrbitSnapshot(DEFAULT_HANDLE);
  return NextResponse.json(
    {
      signal: snapshot.signal,
      missions: snapshot.missions
    },
    { status: 200 }
  );
}
