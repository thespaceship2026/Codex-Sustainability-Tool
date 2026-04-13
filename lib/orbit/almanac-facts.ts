// Orbit v2 — Carbon Almanac Facts
//
// Curated facts from The Carbon Almanac (Carbon Almanac Network / Penguin
// Random House, 2022). The Spaceship Academy is a partner.
//
// Each quiz question maps to a set of facts. After the user answers,
// the QuizFlow shows a relevant fact card — turning the quiz from a
// test into a learning moment. Facts are short, surprising, and
// non-judgmental. The goal is curiosity, not guilt.

export type AlmanacFact = {
  /** Short headline — max ~8 words */
  headline: string;
  /** The surprising fact — 1–2 sentences, conversational */
  body: string;
  /** Source attribution within the Almanac */
  source: string;
  /** Category tag for visual styling */
  category: "energy" | "transport" | "food" | "digital" | "systems";
  /** Optional quote to feature instead of fact */
  quote?: { text: string; attribution: string };
};

// ────────────────────────────────────────────────────────────────────────────
// Facts mapped by quiz questionKey
// ────────────────────────────────────────────────────────────────────────────

export const ALMANAC_FACTS: Record<string, AlmanacFact[]> = {
  // Q1 — Where do you live? (home.country → grid energy)
  "home.country": [
    {
      headline: "One metric ton is huge",
      body: "A single metric ton of CO₂ would fill a cube about 10 metres on each side. The average American is responsible for about 14 of those cubes every year.",
      source: "The Carbon Almanac, Climate Change for Rookies",
      category: "energy",
    },
    {
      headline: "Not all grids are equal",
      body: "How your country generates electricity changes everything. France runs 70% nuclear — so flipping a light switch in Paris produces a fraction of the carbon it does in coal-heavy grids.",
      source: "The Carbon Almanac, Energy",
      category: "energy",
    },
    {
      headline: "6,300 bricks to 440",
      body: "If your annual carbon footprint were measured in bricks, the average American carries about 6,300. The target to stay within safe limits? Around 440.",
      source: "The Carbon Almanac, Climate Change for Rookies",
      category: "systems",
    },
  ],

  // Q2 — How do you get around? (home.car_ownership → transport)
  "home.car_ownership": [
    {
      headline: "The 9 actions that matter most",
      body: "Researchers at Imperial College London identified nine personal actions with the biggest climate impact. Going car-free is one of the top three — ahead of switching your diet.",
      source: "The Carbon Almanac, Biggest Individual Actions",
      category: "transport",
    },
    {
      headline: "It adds up quietly",
      body: "The average car emits about 4.6 metric tons of CO₂ per year — that's roughly one-third of a typical American's entire footprint, just from driving.",
      source: "The Carbon Almanac, Transport",
      category: "transport",
    },
  ],

  // Q3 — How much are you flying? (flight.intent → aviation)
  "flight.intent": [
    {
      headline: "One flight can double it",
      body: "A single round-trip flight from San Francisco to London produces about as much CO₂ as a full year of driving. One trip, one year — same number.",
      source: "The Carbon Almanac, Climate Change for Rookies",
      category: "transport",
    },
    {
      headline: "Flygskam is a real word",
      body: "In Sweden, 'flygskam' — flight shame — became so mainstream that domestic air travel dropped 9% in a single year. Meanwhile, rail bookings surged.",
      source: "The Carbon Almanac, Travel & Transport",
      category: "transport",
      quote: {
        text: "The question isn't whether we can afford to change. It's whether we can afford not to.",
        attribution: "The Carbon Almanac",
      },
    },
  ],

  // Q4 — What does a typical week of eating look like? (food.diet_type)
  "food.diet_type": [
    {
      headline: "The plate is the lever",
      body: "Producing one pound of beef generates about 30 pounds of CO₂. One cheeseburger carries roughly the same emissions as driving 10 miles.",
      source: "The Carbon Almanac, Food & Agriculture",
      category: "food",
    },
    {
      headline: "61% from livestock alone",
      body: "Livestock accounts for 61% of all food production emissions. Shifting even a few meals a week from beef to plants is one of the fastest levers any person can pull.",
      source: "The Carbon Almanac, Food & Agriculture",
      category: "food",
    },
  ],

  // Q5 — What heats your home? (home.heating_fuel)
  "home.heating_fuel": [
    {
      headline: "The invisible half",
      body: "Heating and cooling account for nearly half of a typical home's energy use. Switching from oil to a heat pump can cut that in half again.",
      source: "The Carbon Almanac, Energy at Home",
      category: "energy",
    },
    {
      headline: "Plug loads are sneaky",
      body: "Even after heating, plug loads — every device, charger, and appliance you own — account for around 50% of a building's total energy use. The stuff you forgot was on.",
      source: "The Carbon Almanac, Built Environment",
      category: "digital",
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Reveal-screen quotes — these appear at the end as a parting thought
// ────────────────────────────────────────────────────────────────────────────

export const REVEAL_QUOTES = [
  {
    text: "The top environmental problems are selfishness, greed, and apathy, and to deal with these we need a cultural and spiritual transformation. And we scientists don't know how to do that.",
    attribution: "Gus Speth, environmental lawyer",
  },
  {
    text: "You cannot get through a single day without having an impact on the world around you. What you do makes a difference, and you have to decide what kind of difference you want to make.",
    attribution: "Jane Goodall",
  },
  {
    text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.",
    attribution: "George Bernard Shaw",
  },
];

// Pick a deterministic-but-varied fact for a given question + answer
export function pickFact(questionKey: string, answerValue: string): AlmanacFact {
  const facts = ALMANAC_FACTS[questionKey] ?? [];
  if (facts.length === 0) {
    return {
      headline: "Every choice is a signal",
      body: "The Carbon Almanac documents hundreds of ways individual choices add up to systemic change. This is one of them.",
      source: "The Carbon Almanac",
      category: "systems",
    };
  }
  // Use answer string hash to pick a fact so the same answer always shows
  // the same fact (feels intentional, not random)
  const hash = answerValue.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return facts[hash % facts.length];
}
