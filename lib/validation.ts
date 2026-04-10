import { MetricCategory } from "@prisma/client";
import { z } from "zod";

export const metricInputSchema = z.object({
  year: z.coerce.number().int().min(2000).max(3000),
  month: z.coerce.number().int().min(1).max(12),
  electricityKwh: z.coerce.number().min(0),
  waterM3: z.coerce.number().min(0),
  wasteKg: z.coerce.number().min(0),
  recyclingKg: z.coerce.number().min(0),
  businessTravelKm: z.coerce.number().min(0),
  commutingKm: z.coerce.number().min(0),
  notes: z.string().max(5000).nullable().optional()
});

export const goalInputSchema = z.object({
  category: z.nativeEnum(MetricCategory),
  label: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(40),
  targetValue: z.coerce.number().min(0),
  targetMonth: z.coerce.number().int().min(1).max(12),
  targetYear: z.coerce.number().int().min(2000).max(3000)
});

export const factorInputSchema = z.object({
  category: z.nativeEnum(MetricCategory),
  label: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(40),
  factor: z.coerce.number().min(0),
  description: z.string().max(1000).optional().default("")
});

export const csvImportRequestSchema = z.object({
  csv: z.string().min(1),
  preview: z.boolean().optional().default(false)
});
