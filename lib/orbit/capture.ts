// Orbit v2 — Email capture
//
// Lead magnet sign-ups for the weekly Orbit digest. Kept separate from
// missions/actions because the capture flow is anonymous by default and
// doesn't need to touch MissionState or SignalSnapshot.
//
// The destination is pluggable: today it writes to a Notion database,
// tomorrow it might write to HubSpot, ConvertKit, or a plain webhook.
// The interface below is the swap point. Adding a new destination means
// implementing `CaptureSink` and wiring it into `resolveSink()`.

import { prisma } from "../prisma";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface CapturePayload {
  email: string;
  source?: string;
  travellerId?: string | null;
  signalAtCapture?: number | null;
  monthlyTCO2e?: number | null;
  consent: boolean;
  userAgent?: string | null;
}

export interface CaptureResult {
  id: string;
  email: string;
  syncStatus: "PENDING" | "SYNCED" | "FAILED" | "SKIPPED";
  createdAt: Date;
}

export interface CaptureSink {
  name: string;
  send(record: {
    id: string;
    email: string;
    source: string;
    signalAtCapture: number | null;
    monthlyTCO2e: number | null;
    createdAt: Date;
  }): Promise<{ ok: true } | { ok: false; error: string }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Sinks
//
// NotionSink POSTs to a Notion database via the official REST API. It reads
// its config from env so the deployment can swap databases without a code
// change. If the env vars are missing, the sink short-circuits to SKIPPED so
// local dev doesn't fail every form submission.
//
// NoopSink is used when there's no destination configured — the row still
// lands in the local DB so nothing is lost.
// ────────────────────────────────────────────────────────────────────────────

const NOTION_API = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2022-06-28";

class NotionSink implements CaptureSink {
  name = "notion";
  constructor(
    private readonly token: string,
    private readonly databaseId: string
  ) {}

  async send(record: {
    id: string;
    email: string;
    source: string;
    signalAtCapture: number | null;
    monthlyTCO2e: number | null;
    createdAt: Date;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    const body = {
      parent: { database_id: this.databaseId },
      properties: {
        Email: { title: [{ text: { content: record.email } }] },
        Source: { rich_text: [{ text: { content: record.source } }] },
        "Signal at capture": {
          number: record.signalAtCapture ?? null
        },
        "Monthly tCO2e": {
          number: record.monthlyTCO2e ?? null
        },
        "Captured at": {
          date: { start: record.createdAt.toISOString() }
        },
        "Capture ID": {
          rich_text: [{ text: { content: record.id } }]
        }
      }
    };

    try {
      const res = await fetch(NOTION_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Notion ${res.status}: ${text.slice(0, 300)}` };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown Notion error"
      };
    }
  }
}

class NoopSink implements CaptureSink {
  name = "noop";
  async send() {
    return { ok: true as const };
  }
}

function resolveSink(): CaptureSink {
  const token = process.env.NOTION_CAPTURE_TOKEN;
  const databaseId = process.env.NOTION_CAPTURE_DATABASE_ID;
  if (token && databaseId) return new NotionSink(token, databaseId);
  return new NoopSink();
}

// ────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ────────────────────────────────────────────────────────────────────────────

// A deliberately boring email regex. Tight enough to catch obvious garbage,
// loose enough not to reject legitimate addresses. The canonical source of
// truth is whatever the destination CRM accepts.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  if (!value || value.length > 254) return false;
  return EMAIL_RE.test(value);
}

// ────────────────────────────────────────────────────────────────────────────
// Main entry point
//
// 1. Validate input
// 2. Write EmailCapture row (source of truth — never lost)
// 3. Fire the sink (best effort — retries are out of scope for v2)
// 4. Update sync status
// ────────────────────────────────────────────────────────────────────────────

export async function captureEmail(payload: CapturePayload): Promise<CaptureResult> {
  const email = payload.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }
  if (!payload.consent) {
    throw new Error("CONSENT_REQUIRED");
  }

  const source = payload.source?.trim() || "orbit_perspective";

  const record = await prisma.emailCapture.create({
    data: {
      email,
      source,
      travellerId: payload.travellerId ?? null,
      signalAtCapture: payload.signalAtCapture ?? null,
      monthlyTCO2e: payload.monthlyTCO2e ?? null,
      consent: payload.consent,
      userAgent: payload.userAgent ?? null,
      syncStatus: "PENDING"
    }
  });

  const sink = resolveSink();
  const result = await sink.send({
    id: record.id,
    email: record.email,
    source: record.source,
    signalAtCapture: record.signalAtCapture,
    monthlyTCO2e: record.monthlyTCO2e,
    createdAt: record.createdAt
  });

  const nextStatus =
    sink.name === "noop" ? "SKIPPED" : result.ok ? "SYNCED" : "FAILED";

  const updated = await prisma.emailCapture.update({
    where: { id: record.id },
    data: {
      syncStatus: nextStatus,
      syncedAt: result.ok ? new Date() : null,
      syncError: result.ok ? null : "error" in result ? result.error : null
    }
  });

  return {
    id: updated.id,
    email: updated.email,
    syncStatus: updated.syncStatus as CaptureResult["syncStatus"],
    createdAt: updated.createdAt
  };
}
