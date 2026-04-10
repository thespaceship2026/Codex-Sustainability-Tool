import { NextResponse } from "next/server";

import { getReadOnlyDemoMessage, isReadOnlyDemoMode } from "@/lib/runtime";

export function getReadOnlyDemoResponse() {
  return NextResponse.json({ error: getReadOnlyDemoMessage() }, { status: 403 });
}

export function assertWritableMode() {
  if (isReadOnlyDemoMode()) {
    return getReadOnlyDemoResponse();
  }

  return null;
}
