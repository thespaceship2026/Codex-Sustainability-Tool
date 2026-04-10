// POST /api/missions/[key]/answers
//
// Save (create or update) answers for a mission. Payload is an array so
// the mission 01 form can POST everything in one round-trip, and the
// quick-edit affordance can POST a single answer.
//
// Request body:
//   {
//     "answers": [
//       { "questionKey": "home.sqm", "valueNum": 68 },
//       { "questionKey": "home.heating_fuel", "valueStr": "gas" }
//     ]
//   }
//
// Response: SaveAnswersResult — new mission status, progress, and the
// fresh signal view.

import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_HANDLE, getOrCreateTraveller } from "@/lib/orbit/data";
import { saveMissionAnswers } from "@/lib/orbit/actions";
import { isMissionKey } from "@/lib/orbit/missions";

const AnswerSchema = z
  .object({
    questionKey: z.string().min(1),
    valueNum: z.number().nullable().optional(),
    valueStr: z.string().nullable().optional(),
    valueBool: z.boolean().nullable().optional()
  })
  .refine(
    (a) =>
      a.valueNum != null || a.valueStr != null || a.valueBool != null,
    { message: "Each answer must carry a valueNum, valueStr, or valueBool" }
  );

const PayloadSchema = z.object({
  answers: z.array(AnswerSchema).min(1)
});

export async function POST(
  request: Request,
  { params }: { params: { key: string } }
) {
  if (!isMissionKey(params.key)) {
    return NextResponse.json(
      { error: `Unknown mission key: ${params.key}` },
      { status: 404 }
    );
  }

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

  try {
    const result = await saveMissionAnswers(
      traveller.id,
      params.key,
      parsed.data.answers.map((a) => ({
        questionKey: a.questionKey,
        valueNum: a.valueNum ?? null,
        valueStr: a.valueStr ?? null,
        valueBool: a.valueBool ?? null
      }))
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
