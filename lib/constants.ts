export const categoryMeta = {
  ELECTRICITY: {
    label: "Electricity",
    unit: "kWh",
    factorUnit: "kg CO2e / kWh"
  },
  WATER: {
    label: "Water",
    unit: "m3",
    factorUnit: "kg CO2e / m3"
  },
  WASTE: {
    label: "Waste",
    unit: "kg",
    factorUnit: "kg CO2e / kg"
  },
  RECYCLING: {
    label: "Recycling",
    unit: "kg",
    factorUnit: "kg CO2e avoided / kg"
  },
  BUSINESS_TRAVEL: {
    label: "Business travel",
    unit: "km",
    factorUnit: "kg CO2e / km"
  },
  COMMUTING: {
    label: "Employee commuting",
    unit: "km",
    factorUnit: "kg CO2e / km"
  }
} as const;

export const categoryOrder = [
  "ELECTRICITY",
  "WATER",
  "WASTE",
  "RECYCLING",
  "BUSINESS_TRAVEL",
  "COMMUTING"
] as const;

export type CategoryKey = (typeof categoryOrder)[number];
