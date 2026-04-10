export type MetricInput = {
  month: number;
  year: number;
  electricityKwh: number;
  waterM3: number;
  wasteKg: number;
  recyclingKg: number;
  businessTravelKm: number;
  commutingKm: number;
  notes?: string | null;
};
