// POST /api/missions/[key]/activate
//
// Flip a mission from LOCKED → ACTIVE when the user opens it. Idempotent:
// calling it on a PARTIAL or LIT mission is a no-op. Returns the current
// state row so the client can update the UI.

import { NextResponse } from "next/server";
import { DEFAULT_HANDLE, getOrCreateTraveller } from "@/lib/orbit/data";
import { activateMission } from "@/lib/orbit/actions";
import { isMissionKey } from "@/lib/orbit/missions";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { key: string } }
) {
  if (!isMissionKey(params.key)) {
    return NextResponse.json(
      { error: `Unknown mission key: ${params.key}` },
      { status: 404 }
    );
  }

  const traveller = await getOrCreateTraveller(DEFAULT_HANDLE);
  await activateMission(traveller.id, params.key);

  const state = await prisma.missionState.findUnique({
    where: {
      travellerId_key: { travellerId: traveller.id, key: params.key }
    }
  });

  return NextResponse.json(
    {
      missionKey: params.key,
      status: state?.status ?? "ACTIVE",
      progress: state?.progress ?? 0,
      startedAt: state?.startedAt?.toISOString() ?? null
    },
    { status: 200 }
  );
}
