import type { MetricInput } from "@/lib/types";
import { parsePeriodKey, toPeriodKey } from "@/lib/utils";

const importHeaders = [
  "year",
  "month",
  "electricityKwh",
  "waterM3",
  "wasteKg",
  "recyclingKg",
  "businessTravelKm",
  "commutingKm",
  "notes"
] as const;

const exportHeaders = [...importHeaders, "calculatedTotalEmissionsKgCo2e"] as const;

export type ImportResult = {
  validRows: MetricInput[];
  invalidRows: Array<{ rowNumber: number; reason: string }>;
};

export function metricsToCsv(
  rows: Array<
    Omit<MetricInput, "notes"> & {
      notes?: string | null;
      calculatedTotalEmissionsKgCo2e?: number;
    }
  >
) {
  const lines = [
    exportHeaders.join(","),
    ...rows.map((row) =>
      exportHeaders
        .map((header) => escapeCsv(String(row[header] ?? "")))
        .join(",")
    )
  ];

  return lines.join("\n");
}

export function sampleMetricsCsv() {
  return [
    importHeaders.join(","),
    "2026,4,925,38,126,74,530,1180,Sample row you can edit before import"
  ].join("\n");
}

export function parseMetricsCsv(csv: string): ImportResult {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const parsedHeaders = splitCsvLine(lines[0]);

  if (importHeaders.some((header, index) => parsedHeaders[index] !== header)) {
    throw new Error(`CSV headers must match: ${importHeaders.join(", ")}`);
  }

  const validRows: MetricInput[] = [];
  const invalidRows: Array<{ rowNumber: number; reason: string }> = [];

  lines.slice(1).forEach((line, index) => {
    try {
      const cells = splitCsvLine(line);
      const row = Object.fromEntries(
        importHeaders.map((header, cellIndex) => [header, cells[cellIndex] ?? ""])
      );
      validRows.push(normalizeMetricPayload(row));
    } catch (error) {
      invalidRows.push({
        rowNumber: index + 2,
        reason: error instanceof Error ? error.message : "Invalid row"
      });
    }
  });

  return { validRows, invalidRows };
}

export function normalizeMetricPayload(
  input: Record<string, string | number | null | undefined>
) {
  const parsedYear = Number(input.year);
  const parsedMonth = Number(input.month);

  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 3000) {
    throw new Error("Year must be a 4-digit number.");
  }

  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error("Month must be a number from 1 to 12.");
  }

  return {
    year: parsedYear,
    month: parsedMonth,
    electricityKwh: parseNumber(input.electricityKwh, "electricityKwh"),
    waterM3: parseNumber(input.waterM3, "waterM3"),
    wasteKg: parseNumber(input.wasteKg, "wasteKg"),
    recyclingKg: parseNumber(input.recyclingKg, "recyclingKg"),
    businessTravelKm: parseNumber(input.businessTravelKm, "businessTravelKm"),
    commutingKm: parseNumber(input.commutingKm, "commutingKm"),
    notes: String(input.notes ?? "").trim() || undefined
  };
}

export function metricToEditableForm(
  metric?: (Partial<MetricInput> & { notes?: string | null }) | undefined
) {
  if (!metric) {
    const { year, month } = parsePeriodKey(toPeriodKey(new Date().getFullYear(), new Date().getMonth() + 1));
    return {
      year,
      month,
      electricityKwh: 0,
      waterM3: 0,
      wasteKg: 0,
      recyclingKg: 0,
      businessTravelKm: 0,
      commutingKm: 0,
      notes: ""
    };
  }

  return {
    year: metric.year ?? new Date().getFullYear(),
    month: metric.month ?? new Date().getMonth() + 1,
    electricityKwh: metric.electricityKwh ?? 0,
    waterM3: metric.waterM3 ?? 0,
    wasteKg: metric.wasteKg ?? 0,
    recyclingKg: metric.recyclingKg ?? 0,
    businessTravelKm: metric.businessTravelKm ?? 0,
    commutingKm: metric.commutingKm ?? 0,
    notes: metric.notes ?? ""
  };
}

function parseNumber(value: string | number | null | undefined, field: string) {
  const parsed = Number(value ?? 0);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${field} must be a number greater than or equal to 0.`);
  }

  return parsed;
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}
