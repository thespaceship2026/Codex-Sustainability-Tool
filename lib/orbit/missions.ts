// Orbit v2 — Mission configuration
//
// The source of truth for what missions exist, what questions they ask, and
// how they're scored. Adding a mission means adding an entry here + matching
// EmissionFactor rows in lib/orbit/factors.ts. No schema migration required.

export const MISSION_KEYS = [
  "HOME_BASELINE",
  "FLIGHT_QUESTION",
  "FOOD_CHOICES",
  "DIGITAL_CARBON"
] as const;

export type MissionKey = (typeof MISSION_KEYS)[number];

export const MISSION_STATUSES = ["LOCKED", "ACTIVE", "PARTIAL", "LIT"] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export type QuestionKind =
  | { kind: "number"; min?: number; max?: number; step?: number; unit: string; default?: number }
  | { kind: "choice"; options: Array<{ value: string; label: string }>; default?: string }
  | { kind: "bool"; default?: boolean };

export type Question = {
  key: string; // unique within mission
  prompt: string;
  help?: string;
  required: boolean;
  spec: QuestionKind;
};

export type Mission = {
  key: MissionKey;
  order: number;
  title: string;
  tagline: string; // short serif italic phrase for cards
  description: string;
  estimatedMinutes: number;
  unlocksAfter?: MissionKey[]; // must all be LIT before ACTIVE
  questions: Question[];
};

// ────────────────────────────────────────────────────────────────────────────
// Mission 01 — Home baseline
//
// The outline. A dozen questions about where you live, how you heat it,
// what you spend on electricity, whether you drive. This mission is the
// first one lit because it anchors everything downstream.
// ────────────────────────────────────────────────────────────────────────────

const homeBaseline: Mission = {
  key: "HOME_BASELINE",
  order: 1,
  title: "Home baseline",
  tagline: "The outline is drawn.",
  description:
    "Twelve questions about how you live — square metres, fuel, rooms, bills. Enough to anchor every other mission around.",
  estimatedMinutes: 6,
  questions: [
    {
      key: "home.people",
      prompt: "How many people live in your home?",
      required: true,
      spec: { kind: "number", min: 1, max: 12, step: 1, unit: "people", default: 2 }
    },
    {
      key: "home.sqm",
      prompt: "Roughly how large is your home?",
      help: "A rough guess is fine. Studio ~30, small flat ~55, family house ~120.",
      required: true,
      spec: { kind: "number", min: 10, max: 500, step: 5, unit: "m²", default: 80 }
    },
    {
      key: "home.electricity_kwh_month",
      prompt: "About how many kWh of electricity per month?",
      help: "Check a recent bill. A typical solo dweller uses 150–250, a family 400–700.",
      required: true,
      spec: { kind: "number", min: 0, max: 3000, step: 10, unit: "kWh/mo", default: 280 }
    },
    {
      key: "home.heating_fuel",
      prompt: "What heats your home?",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "electric", label: "Electricity (heat pump or resistive)" },
          { value: "gas", label: "Natural gas or propane" },
          { value: "oil", label: "Heating oil" },
          { value: "district", label: "District heating" },
          { value: "none", label: "No central heating" }
        ],
        default: "gas"
      }
    },
    {
      key: "home.heating_intensity",
      prompt: "How much do you heat it through the cold months?",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "low", label: "Rarely — sweaters over thermostats" },
          { value: "medium", label: "Comfortable but not toasty" },
          { value: "high", label: "Warm enough to walk around in a t-shirt" }
        ],
        default: "medium"
      }
    },
    {
      key: "home.renewable",
      prompt: "Do you pay for a renewable electricity tariff?",
      required: false,
      spec: { kind: "bool", default: false }
    },
    {
      key: "home.car_ownership",
      prompt: "Do you have regular access to a car?",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "none", label: "No car" },
          { value: "shared", label: "Shared or occasional (car club, family car)" },
          { value: "petrol", label: "Own a petrol or diesel car" },
          { value: "hybrid", label: "Own a hybrid" },
          { value: "ev", label: "Own an electric car" }
        ],
        default: "none"
      }
    },
    {
      key: "home.car_km_week",
      prompt: "If you drive, about how many km per week?",
      help: "Skip with 0 if you don't drive regularly.",
      required: false,
      spec: { kind: "number", min: 0, max: 2000, step: 10, unit: "km/wk", default: 0 }
    },
    {
      key: "home.transit_km_week",
      prompt: "How far do you travel on public transit each week?",
      required: false,
      spec: { kind: "number", min: 0, max: 1000, step: 5, unit: "km/wk", default: 40 }
    },
    {
      key: "home.bike_or_walk",
      prompt: "Do you regularly cycle or walk for trips you'd otherwise drive?",
      required: false,
      spec: { kind: "bool", default: true }
    },
    {
      key: "home.rooms_heated",
      prompt: "How many rooms do you heat?",
      required: false,
      spec: { kind: "number", min: 0, max: 12, step: 1, unit: "rooms", default: 3 }
    },
    {
      key: "home.country",
      prompt: "Which country's grid should we use for electricity?",
      help: "We use this to pick the right grid carbon intensity.",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "US", label: "United States (average grid)" },
          { value: "UK", label: "United Kingdom" },
          { value: "FR", label: "France" },
          { value: "DE", label: "Germany" },
          { value: "OTHER", label: "Somewhere else (we'll use a global average)" }
        ],
        default: "US"
      }
    }
  ]
};

// ────────────────────────────────────────────────────────────────────────────
// Mission 02 — Flight question
//
// The big one. Flights dominate personal footprints for anyone who flies.
// Honest answers here are worth more than a year of small tweaks.
// ────────────────────────────────────────────────────────────────────────────

const flightQuestion: Mission = {
  key: "FLIGHT_QUESTION",
  order: 2,
  title: "The flight question",
  tagline: "Half the story of your footprint.",
  description:
    "One trip this year, or two? Your answer is already half the story of your 2026 footprint. Seven questions left.",
  estimatedMinutes: 4,
  questions: [
    {
      key: "flight.intent",
      prompt: "How many flights are you planning this year?",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "none", label: "None planned" },
          { value: "one_short", label: "One short trip (under 3 hours)" },
          { value: "one_long", label: "One long trip (over 6 hours)" },
          { value: "two_plus", label: "Two or more trips" },
          { value: "frequent", label: "I fly monthly or more for work" }
        ],
        default: "one_short"
      }
    },
    {
      key: "flight.shorthaul_count",
      prompt: "How many short-haul round trips this year?",
      help: "Domestic or within a region — under about 1500 km each way.",
      required: false,
      spec: { kind: "number", min: 0, max: 40, step: 1, unit: "round trips", default: 1 }
    },
    {
      key: "flight.mediumhaul_count",
      prompt: "How many medium-haul round trips?",
      help: "Roughly 1500–4000 km each way.",
      required: false,
      spec: { kind: "number", min: 0, max: 20, step: 1, unit: "round trips", default: 0 }
    },
    {
      key: "flight.longhaul_count",
      prompt: "How many long-haul round trips?",
      help: "Over 4000 km each way. Most transatlantic and transpacific trips.",
      required: false,
      spec: { kind: "number", min: 0, max: 15, step: 1, unit: "round trips", default: 0 }
    },
    {
      key: "flight.cabin_class",
      prompt: "What cabin class is most typical for you?",
      help: "Premium seats take more space per passenger, so they carry a bigger share.",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "economy", label: "Economy" },
          { value: "premium_economy", label: "Premium economy" },
          { value: "business", label: "Business" },
          { value: "first", label: "First" }
        ],
        default: "economy"
      }
    },
    {
      key: "flight.work_or_personal",
      prompt: "Is most of your flying for work, personal, or mixed?",
      required: false,
      spec: {
        kind: "choice",
        options: [
          { value: "personal", label: "Mostly personal" },
          { value: "work", label: "Mostly work" },
          { value: "mixed", label: "A mix of both" }
        ],
        default: "personal"
      }
    },
    {
      key: "flight.would_skip_one",
      prompt: "Could you realistically skip or replace one trip this year?",
      help: "No judgement — just an honest look at the room for change.",
      required: false,
      spec: { kind: "bool", default: true }
    }
  ]
};

// ────────────────────────────────────────────────────────────────────────────
// Mission 03 — Food choices
//
// The estimate-first-refine-later mission. First version pulls a rough shape
// from a few yes/no questions; the refine pass lets people tally a real week.
// ────────────────────────────────────────────────────────────────────────────

const foodChoices: Mission = {
  key: "FOOD_CHOICES",
  order: 3,
  title: "Food choices",
  tagline: "A rough picture in five minutes.",
  description:
    "A first estimate from how your typical week looks on a plate. Refine it when a quiet moment appears.",
  estimatedMinutes: 3,
  questions: [
    {
      key: "food.diet_type",
      prompt: "Which best describes your week of eating?",
      required: true,
      spec: {
        kind: "choice",
        options: [
          { value: "heavy_meat", label: "Meat most days, red meat several times a week" },
          { value: "meat", label: "Meat most days, mostly chicken and pork" },
          { value: "flexitarian", label: "Meat a few days a week" },
          { value: "pescatarian", label: "No meat, but fish and dairy" },
          { value: "vegetarian", label: "No meat or fish, but dairy and eggs" },
          { value: "vegan", label: "Fully plant-based" }
        ],
        default: "flexitarian"
      }
    },
    {
      key: "food.beef_meals_week",
      prompt: "Roughly how many beef meals per week?",
      help: "Beef is by far the highest-impact meat. Be honest.",
      required: false,
      spec: { kind: "number", min: 0, max: 21, step: 1, unit: "meals/wk", default: 2 }
    },
    {
      key: "food.dairy_intensity",
      prompt: "How dairy-heavy is your week?",
      required: false,
      spec: {
        kind: "choice",
        options: [
          { value: "none", label: "None" },
          { value: "light", label: "A splash in coffee, occasional cheese" },
          { value: "medium", label: "Milk, yogurt, cheese most days" },
          { value: "heavy", label: "Dairy in most meals" }
        ],
        default: "medium"
      }
    },
    {
      key: "food.waste",
      prompt: "How much of the food you buy ends up thrown away?",
      help: "The global average is around a quarter. Most people guess low.",
      required: false,
      spec: {
        kind: "choice",
        options: [
          { value: "very_low", label: "Under 10%" },
          { value: "low", label: "10–20%" },
          { value: "medium", label: "20–30%" },
          { value: "high", label: "Over 30%" }
        ],
        default: "medium"
      }
    },
    {
      key: "food.local_seasonal",
      prompt: "Do you try to buy local and seasonal when you can?",
      required: false,
      spec: { kind: "bool", default: true }
    },
    {
      key: "food.delivery_freq",
      prompt: "How often do you get food delivered?",
      required: false,
      spec: {
        kind: "choice",
        options: [
          { value: "never", label: "Rarely or never" },
          { value: "weekly", label: "About once a week" },
          { value: "multi", label: "Several times a week" }
        ],
        default: "weekly"
      }
    }
  ]
};

// ────────────────────────────────────────────────────────────────────────────
// Mission 04 — Digital carbon (locked until M03 is at least partial)
// ────────────────────────────────────────────────────────────────────────────

const digitalCarbon: Mission = {
  key: "DIGITAL_CARBON",
  order: 4,
  title: "Digital carbon",
  tagline: "The hidden weight of streams and clouds.",
  description:
    "Unlocks after your first three missions. The quiet footprint of streaming, training, cloud storage, and a year of pocket-sized decisions.",
  estimatedMinutes: 4,
  unlocksAfter: ["HOME_BASELINE", "FLIGHT_QUESTION", "FOOD_CHOICES"],
  questions: [
    {
      key: "digital.streaming_hours_day",
      prompt: "How many hours of video streaming do you watch per day?",
      required: true,
      spec: { kind: "number", min: 0, max: 24, step: 0.5, unit: "hrs/day", default: 2 }
    },
    {
      key: "digital.cloud_gb",
      prompt: "How much cloud storage are you paying for?",
      required: false,
      spec: {
        kind: "choice",
        options: [
          { value: "none", label: "None that I pay for" },
          { value: "50gb", label: "~50 GB" },
          { value: "200gb", label: "~200 GB" },
          { value: "1tb", label: "~1 TB" },
          { value: "2tb_plus", label: "2 TB or more" }
        ],
        default: "200gb"
      }
    },
    {
      key: "digital.devices",
      prompt: "How many active devices do you use regularly?",
      help: "Phones, laptops, tablets, watches, consoles — anything you plug in and use.",
      required: false,
      spec: { kind: "number", min: 0, max: 20, step: 1, unit: "devices", default: 3 }
    },
    {
      key: "digital.ai_usage",
      prompt: "How heavily do you use AI assistants?",
      required: false,
      spec: {
        kind: "choice",
        options: [
          { value: "none", label: "Not at all" },
          { value: "light", label: "A few times a week" },
          { value: "daily", label: "Daily, but lightly" },
          { value: "heavy", label: "Constantly throughout the day" }
        ],
        default: "daily"
      }
    }
  ]
};

export const MISSIONS: Record<MissionKey, Mission> = {
  HOME_BASELINE: homeBaseline,
  FLIGHT_QUESTION: flightQuestion,
  FOOD_CHOICES: foodChoices,
  DIGITAL_CARBON: digitalCarbon
};

export const MISSION_LIST: Mission[] = Object.values(MISSIONS).sort(
  (a, b) => a.order - b.order
);

export function getMission(key: string): Mission | null {
  if ((MISSION_KEYS as readonly string[]).includes(key)) {
    return MISSIONS[key as MissionKey];
  }
  return null;
}

export function isMissionKey(value: string): value is MissionKey {
  return (MISSION_KEYS as readonly string[]).includes(value);
}
