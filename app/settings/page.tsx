import { AuditHistory } from "@/components/audit-history";
import { Card } from "@/components/card";
import { CsvTools } from "@/components/csv-tools";
import { FactorHistory } from "@/components/factor-history";
import { FactorsForm } from "@/components/factors-form";
import { SettingsDataHealth } from "@/components/settings-data-health";
import { getSettingsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { currentFactors, factorHistory, latestAuditLogs, dataHealth } =
    await getSettingsData();

  return (
    <main className="space-y-6">
      <Card
        title="Data health"
        description="Quick checks to catch data issues before they become reporting problems."
      >
        <SettingsDataHealth {...dataHealth} />
      </Card>
      <Card
        title="Emission factors"
        description="Edit the local factors that feed every emissions calculation."
      >
        <FactorsForm factors={currentFactors} />
      </Card>
      <Card
        title="Factor history"
        description="Each factor change creates a new version so historical metrics stay explainable."
      >
        <FactorHistory factors={factorHistory} />
      </Card>
      <Card
        title="CSV import and export"
        description="Download all metrics, grab a starter template, or import validated CSV rows."
      >
        <CsvTools />
      </Card>
      <Card
        title="Recent activity"
        description="A lightweight audit trail of metrics, goals, and factor changes."
      >
        <AuditHistory logs={latestAuditLogs} />
      </Card>
    </main>
  );
}
