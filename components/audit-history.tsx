import type { AuditLog } from "@prisma/client";

export function AuditHistory({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <div className="rounded-2xl bg-mist p-4 text-sm text-slate-600">
          No audited changes yet.
        </div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-slate-200 bg-mist px-4 py-3 text-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">
                  {log.action} · {log.entityType.replaceAll("_", " ")}
                </p>
                <p className="text-slate-500">{log.entityId}</p>
              </div>
              <p className="text-slate-500">
                {new Date(log.createdAt).toLocaleString("en-US")}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
