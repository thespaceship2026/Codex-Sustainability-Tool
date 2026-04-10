"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { getReadOnlyDemoMessage, isReadOnlyDemoMode } from "@/lib/runtime";

export function CsvTools() {
  const router = useRouter();
  const isReadOnlyDemo = isReadOnlyDemoMode();
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    preview?: boolean;
    importedCount: number;
    creatingCount?: number;
    overwritingCount?: number;
    invalidCount: number;
    invalidRows: Array<{ rowNumber: number; reason: string }>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function sendCsv(preview: boolean) {
    if (isReadOnlyDemo) {
      setStatus(getReadOnlyDemoMessage());
      setSummary(null);
      return;
    }

    setStatus(null);

    startTransition(async () => {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ csv, preview })
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus(result.error ?? "Import failed.");
        setSummary(null);
        return;
      }

      setStatus(preview ? "Preview ready." : "Import complete.");
      setSummary(result);
      if (!preview) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/export/csv"
          className="rounded-full border border-moss/20 bg-mist px-5 py-3 text-sm font-semibold text-moss hover:border-moss/40 hover:bg-white"
        >
          Export CSV
        </a>
        <button
          type="button"
          onClick={() => sendCsv(true)}
          disabled={isPending || !csv.trim() || isReadOnlyDemo}
          className="rounded-full border border-moss/20 bg-white px-5 py-3 text-sm font-semibold text-moss hover:border-moss/40 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isReadOnlyDemo ? "Read-only demo" : isPending ? "Working..." : "Preview import"}
        </button>
        <button
          type="button"
          onClick={() => sendCsv(false)}
          disabled={isPending || !csv.trim() || isReadOnlyDemo}
          className="rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isReadOnlyDemo ? "Read-only demo" : isPending ? "Importing..." : "Import CSV"}
        </button>
        <a
          href="/api/sample-csv"
          className="rounded-full border border-moss/20 bg-white px-5 py-3 text-sm font-semibold text-moss hover:border-moss/40 hover:bg-mist"
        >
          Download sample template
        </a>
      </div>
      <textarea
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        rows={10}
        className="w-full rounded-2xl border border-slate-200 bg-mist px-4 py-3 font-mono text-sm"
        placeholder="Paste CSV rows here. Use the export as a template."
        disabled={isReadOnlyDemo}
      />
      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      {summary ? (
        <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
          <p className="font-medium text-ink">
            {summary.preview
              ? `Preview: ${summary.creatingCount ?? 0} new row(s), ${
                  summary.overwritingCount ?? 0
                } row(s) will update existing months, ${summary.invalidCount} invalid row(s).`
              : `Imported ${summary.importedCount} row(s), including ${
                  summary.creatingCount ?? 0
                } new row(s) and ${summary.overwritingCount ?? 0} updated row(s). Skipped ${
                  summary.invalidCount
                } invalid row(s).`}
          </p>
          {summary.invalidRows.length > 0 ? (
            <div className="mt-3 space-y-2">
              {summary.invalidRows.map((row) => (
                <p key={`${row.rowNumber}-${row.reason}`}>
                  Row {row.rowNumber}: {row.reason}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
