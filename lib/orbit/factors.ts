// Orbit v2 — Emission factors
//
// Each factor is kgCO2e per unit. Units are chosen to match the question
// shape in lib/orbit/missions.ts so the signal calculation can plug raw
// answers in without intermediate conversions.
//
// Sources are cited in the `source` field on each row. When a factor is
// updated, bump `version` and set `isCurrent: false` on the old row rather
// than editing in place — MissionAnswer.factorSnapshot captures the values
// in effect at the moment of the answer so old signals stay reproducible.
//
// Scope: this is the seed dataset. At runtime the real table lives in
// EmissionFactor (see prisma/schema.prisma) and can be updated without a
// code change. Add rows here, run `npm run db:seed`, and they flow through.

export type FactorRow = {
  category: string;
  label: string;
  unit: string;
  factor: number; // kgCO2e per unit
  version: number;
  source: string;
  notes?: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Home — electricity by grid
//
// Grid carbon intensities vary wildly. France ~55 g/kWh thanks to nuclear;
// Germany ~380 g/kWh with coal still in the mix; US average ~390 g/kWh.
// Numbers here are in kg per kWh.
// ────────────────────────────────────────────────────────────────────────────

export const HOME_ELECTRICITY: FactorRow[] = [
  {
    category: "HOME_ELECTRICITY_US",
    label: "Electricity — United States average grid",
    unit: "kWh",
    factor: 0.39,
    version: 1,
    source: "EPA eGRID 2024"
  },
  {
    category: "HOME_ELECTRICITY_UK",
    label: "Electricity — United Kingdom grid",
    unit: "kWh",
    factor: 0.207,
    version: 1,
    source: "UK DEFRA 2024"
  },
  {
    category: "HOME_ELECTRICITY_FR",
    label: "Electricity — France grid",
    unit: "kWh",
    factor: 0.055,
    version: 1,
    source: "ADEME Base Carbone 2024"
  },
  {
    category: "HOME_ELECTRICITY_DE",
    label: "Electricity — Germany grid",
    unit: "kWh",
    factor: 0.38,
    version: 1,
    source: "Umweltbundesamt 2024"
  },
  {
    category: "HOME_ELECTRICITY_OTHER",
    label: "Electricity — global average",
    unit: "kWh",
    factor: 0.475,
    version: 1,
    source: "IEA World Energy Outlook 2024"
  }
];

// ────────────────────────────────────────────────────────────────────────────
// Home — heating fuels
// ────────────────────────────────────────────────────────────────────────────

export const HOME_HEATING: FactorRow[] = [
  {
    category: "HOME_GAS",
    label: "Natural gas for heating",
    unit: "kWh",
    factor: 0.202,
    version: 1,
    source: "UK DEFRA 2024"
  },
  {
    category: "HOME_OIL",
    label: "Heating oil",
    unit: "kWh",
    factor: 0.267,
    version: 1,
    source: "UK DEFRA 2024"
  },
  {
    category: "HOME_DISTRICT",
    label: "District heating (average mix)",
    unit: "kWh",
    factor: 0.17,
    version: 1,
    source: "IEA District Heating 2023"
  }
];

// ────────────────────────────────────────────────────────────────────────────
// Ground transport — per passenger-km
// ────────────────────────────────────────────────────────────────────────────

export const GROUND_TRANSPORT: FactorRow[] = [
  {
    category: "CAR_PETROL",
    label: "Petrol/diesel car (average)",
    unit: "km",
    factor: 0.192,
    version: 1,
    source: "UK DEFRA 2024"
  },
  {
    category: "CAR_HYBRID",
    label: "Hybrid car",
    unit: "km",
    factor: 0.12,
    version: 1,
    source: "UK DEFRA 2024"
  },
  {
    category: "CAR_EV",
    label: "Electric car (grid average)",
    unit: "km",
    factor: 0.053,
    version: 1,
    source: "ICCT 2023 lifecycle (use phase)"
  },
  {
    category: "CAR_SHARED",
    label: "Shared or occasional car use (blend)",
    unit: "km",
    factor: 0.14,
    version: 1,
    source: "UK DEFRA 2024 (blended)"
  },
  {
    category: "TRANSIT_AVERAGE",
    label: "Public transit (bus + rail blend)",
    unit: "km",
    factor: 0.06,
    version: 1,
    source: "UK DEFRA 2024"
  }
];

// ────────────────────────────────────────────────────────────────────────────
// Flights — per passenger, per round trip, economy baseline
//
// Round-trip averages baked in so the question can ask "how many trips".
// Short: average 1000 km each way. Medium: 2500 km. Long: 7500 km.
// Includes a radiative forcing multiplier of 1.9x already applied.
// Cabin multipliers applied at calc time (see signal.ts).
// ────────────────────────────────────────────────────────────────────────────

export const FLIGHTS: FactorRow[] = [
  {
    category: "FLIGHT_SHORT",
    label: "Short-haul round trip (economy, <1500 km each way)",
    unit: "round trip",
    factor: 460,
    version: 1,
    source: "UK DEFRA 2024, RFI 1.9x applied"
  },
  {
    category: "FLIGHT_MEDIUM",
    label: "Medium-haul round trip (economy, 1500–4000 km each way)",
    unit: "round trip",
    factor: 1100,
    version: 1,
    source: "UK DEFRA 2024, RFI 1.9x applied"
  },
  {
    category: "FLIGHT_LONG",
    label: "Long-haul round trip (economy, >4000 km each way)",
    unit: "round trip",
    factor: 2900,
    version: 1,
    source: "UK DEFRA 2024, RFI 1.9x applied"
  }
];

// Cabin class multipliers — applied in signal.ts, not stored per row.
export const CABIN_MULTIPLIER: Record<string, number> = {
  economy: 1.0,
  premium_economy: 1.6,
  business: 2.9,
  first: 4.0
};

// ────────────────────────────────────────────────────────────────────────────
// Food — per meal
//
// "Meal" here is a normalised 500g prepared serving. Values are whole-diet
// lifecycle (production + processing + transport + retail).
// ────────────────────────────────────────────────────────────────────────────

export const FOOD: FactorRow[] = [
  {
    category: "FOOD_BEEF_MEAL",
    label: "Beef-based meal",
    unit: "meal",
    factor: 7.2,
    version: 1,
    source: "Poore & Nemecek 2018 (Science)"
  },
  {
    category: "FOOD_LAMB_MEAL",
    label: "Lamb-based meal",
    unit: "meal",
    factor: 6.8,
    version: 1,
    source: "Poore & Nemecek 2018"
  },
  {
    category: "FOOD_PORK_MEAL",
    label: "Pork-based meal",
    unit: "meal",
    factor: 2.4,
    version: 1,
    source: "Poore & Nemecek 2018"
  },
  {
    category: "FOOD_CHICKEN_MEAL",
    label: "Chicken-based meal",
    unit: "meal",
    factor: 1.5,
    version: 1,
    source: "Poore & Nemecek 2018"
  },
  {
    category: "FOOD_FISH_MEAL",
    label: "Fish or seafood meal",
    unit: "meal",
    factor: 1.8,
    version: 1,
    source: "Poore & Nemecek 2018 (farmed average)"
  },
  {
    category: "FOOD_VEGETARIAN_MEAL",
    label: "Vegetarian meal with dairy and eggs",
    unit: "meal",
    factor: 0.9,
    version: 1,
    source: "Poore & Nemecek 2018"
  },
  {
    category: "FOOD_VEGAN_MEAL",
    label: "Vegan meal",
    unit: "meal",
    factor: 0.5,
    version: 1,
    source: "Poore & Nemecek 2018"
  },
  {
    category: "FOOD_DAIRY_DAY",
    label: "Dairy, per day at medium intensity",
    unit: "day",
    factor: 1.3,
    version: 1,
    source: "Poore & Nemecek 2018"
  },
  {
    category: "FOOD_DELIVERY_ORDER",
    label: "Food delivery order (packaging + last mile)",
    unit: "order",
    factor: 1.1,
    version: 1,
    source: "Shi et al. 2019"
  }
];

// ────────────────────────────────────────────────────────────────────────────
// Digital — streaming, cloud storage, devices, AI
//
// Digital numbers are notoriously contested. We use conservative midpoints
// from IEA's 2023 data-centre methodology plus Shift Project updates.
// ────────────────────────────────────────────────────────────────────────────

export const DIGITAL: FactorRow[] = [
  {
    category: "DIGITAL_STREAMING_HOUR",
    label: "Video streaming",
    unit: "hour",
    factor: 0.036,
    version: 1,
    source: "IEA 2023, Carbon Trust 2021"
  },
  {
    category: "DIGITAL_CLOUD_GB_MONTH",
    label: "Cloud storage",
    unit: "GB·month",
    factor: 0.01,
    version: 1,
    source: "Shift Project 2023"
  },
  {
    category: "DIGITAL_DEVICE_YEAR",
    label: "Connected device (amortised embodied footprint)",
    unit: "device·year",
    factor: 22,
    version: 1,
    source: "ADEME device LCA 2023 (averaged across phone/laptop/tablet)"
  },
  {
    category: "DIGITAL_AI_DAILY",
    label: "AI assistant usage",
    unit: "day",
    factor: 0.08,
    version: 1,
    source: "Luccioni et al. 2024"
  }
];

// ────────────────────────────────────────────────────────────────────────────
// Combined seed dataset
// ────────────────────────────────────────────────────────────────────────────

export const ALL_FACTORS: FactorRow[] = [
  ...HOME_ELECTRICITY,
  ...HOME_HEATING,
  ...GROUND_TRANSPORT,
  ...FLIGHTS,
  ...FOOD,
  ...DIGITAL
];

export function getFactor(category: string, factors: FactorRow[] = ALL_FACTORS): FactorRow | null {
  return factors.find((f) => f.category === category) ?? null;
}

// Fair-share budget — the annual target implied by a 1.5°C pathway, divided
// across humanity. Used as the anchor for the Descent ladder and signal score.
export const FAIR_SHARE_TCO2E_YEAR = 2.0;
export const FAIR_SHARE_TCO2E_MONTH = FAIR_SHARE_TCO2E_YEAR / 12;

// Global average — what a signal score of 50 is calibrated against.
export const GLOBAL_AVG_TCO2E_YEAR = 4.7;
export const GLOBAL_AVG_TCO2E_MONTH = GLOBAL_AVG_TCO2E_YEAR / 12;
