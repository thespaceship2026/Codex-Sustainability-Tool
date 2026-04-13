"use client";

// Orbit v2 \u2014 The Ripple Effect
//
// Innovation for people and planets. Every choice is an act of design.
//
// Phases:
//   1. Pick \u2014 choose one way to shape what\u2019s next
//   2. Ripple \u2014 see the future you\u2019re building
//   3. Transition \u2014 bridge to personal discovery
//   4. Quiz \u2014 5 fast questions to find your arena
//   5. Reveal \u2014 your superpower, not a score
//   6. Close \u2014 quote, Thrive Lab bridge, email capture
//
// Fun, playful, empowering. On-brand for The Spaceship Academy.

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  calculateSignal,
  type AnswerInput,
  type MissionStateInput,
} from "@/lib/orbit/signal";
import { REVEAL_QUOTES } from "@/lib/orbit/almanac-facts";

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// Data
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

type RippleLevel = {
  scale: string;
  people: string;
  fact: string;
  factSource: string;
};

type RippleChoice = {
  id: string;
  icon: string;
  label: string;
  tagline: string;
  monthlySavingsKg: number;
  color: string;
  levels: RippleLevel[];
};

const RIPPLE_CHOICES: RippleChoice[] = [
  {
    id: "bike",
    icon: "\uD83D\uDEB2",
    label: "Redesign your commute",
    tagline: "Join the movement reinventing how cities move.",
    monthlySavingsKg: 24,
    color: "var(--mint)",
    levels: [
      {
        scale: "YOU",
        people: "1",
        fact: "One car-free commute day per week saves roughly 24 kg of CO\u2082 a month. That\u2019s nearly 300 kg a year\u2014and it\u2019s the kind of design thinking that reshapes cities.",
        factSource: "The Carbon Almanac, Biggest Individual Actions",
      },
      {
        scale: "YOUR CIRCLE",
        people: "10",
        fact: "When ten people rethink their commute, they eliminate about 3 tonnes of CO\u2082 a year. Imperial College London found that going car-free is one of the top three highest-impact choices anyone can make.",
        factSource: "The Carbon Almanac, Transport",
      },
      {
        scale: "YOUR TOWN",
        people: "1,000",
        fact: "A thousand people reimagining their commute removes 288 tonnes of CO\u2082 a year\u2014equivalent to taking 62 cars off the road permanently. That\u2019s a community redesigning its future.",
        factSource: "The Carbon Almanac, Transport",
      },
      {
        scale: "YOUR CITY",
        people: "500,000",
        fact: "Half a million people rethinking movement would eliminate 144,000 tonnes of CO\u2082 annually. That\u2019s not behavior change. That\u2019s a mobility revolution.",
        factSource: "The Carbon Almanac, Transport",
      },
    ],
  },
  {
    id: "meals",
    icon: "\uD83C\uDF31",
    label: "Reinvent your plate",
    tagline: "Be part of the food systems revolution.",
    monthlySavingsKg: 45,
    color: "var(--cyan)",
    levels: [
      {
        scale: "YOU",
        people: "1",
        fact: "Producing one pound of beef generates about 30 pounds of CO\u2082. Choosing plants twice a week makes you part of the fastest-growing food innovation movement on the planet.",
        factSource: "The Carbon Almanac, Food & Agriculture",
      },
      {
        scale: "YOUR CIRCLE",
        people: "10",
        fact: "Ten people shifting two meals a week diverts over 5 tonnes of CO\u2082 a year. Livestock accounts for 61% of all food production emissions\u2014this is where future shapers are focusing.",
        factSource: "The Carbon Almanac, Food & Agriculture",
      },
      {
        scale: "YOUR TOWN",
        people: "1,000",
        fact: "A thousand people reimagining their plates keeps 540 tonnes of CO\u2082 out of the atmosphere each year. The food system is being redesigned right now\u2014and it starts with what you eat.",
        factSource: "The Carbon Almanac, Food & Agriculture",
      },
      {
        scale: "YOUR CITY",
        people: "500,000",
        fact: "Half a million people reinventing how they eat would prevent 270,000 tonnes of CO\u2082 annually. That\u2019s not a diet. That\u2019s a food system transformation.",
        factSource: "The Carbon Almanac, Food & Agriculture",
      },
    ],
  },
  {
    id: "flight",
    icon: "\u2708\uFE0F",
    label: "Rethink how you travel",
    tagline: "Pioneer the future of low-carbon exploration.",
    monthlySavingsKg: 96,
    color: "var(--sky)",
    levels: [
      {
        scale: "YOU",
        people: "1",
        fact: "A single round-trip flight from San Francisco to London produces about as much CO\u2082 as a full year of driving. Choosing the train or a closer destination is the single highest-leverage move most people can make.",
        factSource: "The Carbon Almanac, Climate Change for Rookies",
      },
      {
        scale: "YOUR CIRCLE",
        people: "10",
        fact: "Ten people choosing surface travel over one long flight saves 11.5 tonnes of CO\u2082. In Sweden, the shift to rail became so popular that domestic air travel dropped 9% in a single year.",
        factSource: "The Carbon Almanac, Travel & Transport",
      },
      {
        scale: "YOUR TOWN",
        people: "1,000",
        fact: "A thousand people pioneering low-carbon travel saves 1,150 tonnes of CO\u2082. That\u2019s the equivalent of a small forest absorbing carbon for an entire year\u2014created by people who chose to explore differently.",
        factSource: "The Carbon Almanac, Travel & Transport",
      },
      {
        scale: "YOUR CITY",
        people: "500,000",
        fact: "Half a million people reimagining travel would prevent 575,000 tonnes of CO\u2082. That\u2019s not sacrifice. That\u2019s a generation reinventing how the world explores.",
        factSource: "The Carbon Almanac, Travel & Transport",
      },
    ],
  },
  {
    id: "unplug",
    icon: "\uD83D\uDD0C",
    label: "Hack your energy footprint",
    tagline: "The smartest energy is the energy you never use.",
    monthlySavingsKg: 15,
    color: "var(--glow)",
    levels: [
      {
        scale: "YOU",
        people: "1",
        fact: "Plug loads\u2014every device, charger, and appliance on standby\u2014account for around 50% of a building\u2019s total energy use. Hacking that invisible waste is one of the smartest moves you can make.",
        factSource: "The Carbon Almanac, Built Environment",
      },
      {
        scale: "YOUR CIRCLE",
        people: "10",
        fact: "Ten people getting smart about idle power saves nearly 2 tonnes of CO\u2082 a year. Gaming consoles alone draw 150\u2013216 Wh per hour\u2014and keep drawing when you walk away. The first step is seeing what others miss.",
        factSource: "The Carbon Almanac, Energy at Home",
      },
      {
        scale: "YOUR TOWN",
        people: "1,000",
        fact: "A thousand households hacking standby power removes 180 tonnes of CO\u2082 annually. It\u2019s the kind of systems thinking that turns invisible waste into visible innovation.",
        factSource: "The Carbon Almanac, Built Environment",
      },
      {
        scale: "YOUR CITY",
        people: "500,000",
        fact: "Half a million households redesigning their energy use would save 90,000 tonnes of CO\u2082 a year. All from seeing what nobody else noticed.",
        factSource: "The Carbon Almanac, Built Environment",
      },
    ],
  },
];

// Ring colors per level
const RING_COLORS = ["var(--mint)", "var(--cyan)", "var(--sky)", "var(--glow)"];
const RING_LABELS = ["YOU", "YOUR CREW", "A MOVEMENT", "A CITY"];

// \u2500\u2500 Quiz questions (same 5, reframed for ripple) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

type QuizOption = { value: string; label: string };
type QuizQuestion = {
  id: number;
  missionKey: "HOME_BASELINE" | "FLIGHT_QUESTION" | "FOOD_CHOICES";
  questionKey: string;
  prompt: string;
  subtext: string;
  options: QuizOption[];
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    missionKey: "HOME_BASELINE",
    questionKey: "home.country",
    prompt: "Where in the world are you?",
    subtext: "Every grid is different. This shapes what innovation looks like where you live.",
    options: [
      { value: "US", label: "\uD83C\uDDFA\uD83C\uDDF8 United States" },
      { value: "UK", label: "\uD83C\uDDEC\uD83C\uDDE7 United Kingdom" },
      { value: "FR", label: "\uD83C\uDDEB\uD83C\uDDF7 France" },
      { value: "DE", label: "\uD83C\uDDE9\uD83C\uDDEA Germany" },
      { value: "OTHER", label: "\uD83C\uDF0D Somewhere else" },
    ],
  },
  {
    id: 2,
    missionKey: "HOME_BASELINE",
    questionKey: "home.car_ownership",
    prompt: "How do you move?",
    subtext: "Mobility is being reinvented right now. Where are you in that story?",
    options: [
      { value: "none", label: "Walk, bike, or transit" },
      { value: "shared", label: "Car-share or occasional use" },
      { value: "petrol", label: "Petrol or diesel car" },
      { value: "hybrid", label: "Hybrid" },
      { value: "ev", label: "Electric car" },
    ],
  },
  {
    id: 3,
    missionKey: "FLIGHT_QUESTION",
    questionKey: "flight.intent",
    prompt: "How do you explore?",
    subtext: "How you travel is one of the most powerful design decisions you make each year.",
    options: [
      { value: "none", label: "Staying grounded this year" },
      { value: "one_short", label: "One short trip" },
      { value: "one_long", label: "One longer trip" },
      { value: "two_plus", label: "A few trips" },
      { value: "frequent", label: "Flying most months" },
    ],
  },
  {
    id: 4,
    missionKey: "FOOD_CHOICES",
    questionKey: "food.diet_type",
    prompt: "What\u2019s on your plate?",
    subtext: "The food system is being redesigned. Your plate is where you shape it.",
    options: [
      { value: "heavy_meat", label: "Lots of red meat" },
      { value: "meat", label: "Mostly chicken and pork" },
      { value: "flexitarian", label: "A bit of everything" },
      { value: "pescatarian", label: "Fish, no meat" },
      { value: "vegetarian", label: "Vegetarian" },
      { value: "vegan", label: "Fully plant-based" },
    ],
  },
  {
    id: 5,
    missionKey: "HOME_BASELINE",
    questionKey: "home.heating_fuel",
    prompt: "What powers your home?",
    subtext: "The energy transition starts in the places we live. This is yours.",
    options: [
      { value: "electric", label: "Electricity or heat pump" },
      { value: "gas", label: "Natural gas" },
      { value: "oil", label: "Heating oil" },
      { value: "district", label: "District heating" },
      { value: "none", label: "No central heating" },
    ],
  },
];

// Category labels and icons for reveal
const CATEGORY_REVEAL: Record<
  string,
  { emoji: string; label: string; headline: string; body: string }
> = {
  home: {
    emoji: "\uD83C\uDFE0",
    label: "YOUR ARENA: ENERGY",
    headline: "You\u2019re an energy innovator.",
    body: "How you heat and power your space is where you have the most leverage right now. The people redesigning home energy are shaping the grid of the future\u2014and that starts with your home.",
  },
  flights: {
    emoji: "\u2708\uFE0F",
    label: "YOUR ARENA: TRAVEL",
    headline: "You\u2019re a travel pioneer.",
    body: "How you explore the world is your single most powerful design decision. The future of travel is being written right now by people who choose to move differently.",
  },
  food: {
    emoji: "\uD83C\uDF31",
    label: "YOUR ARENA: FOOD SYSTEMS",
    headline: "You\u2019re a food systems innovator.",
    body: "Your plate is where individual choices reshape entire supply chains. Every meal is a vote for the food system you want to see\u2014and yours carries more weight than you think.",
  },
  digital: {
    emoji: "\uD83D\uDD0C",
    label: "YOUR ARENA: DIGITAL",
    headline: "You\u2019re a digital systems thinker.",
    body: "You see what others miss. Streaming, cloud storage, always-on devices\u2014invisible infrastructure with visible impact. The people who understand this are the ones who\u2019ll redesign it.",
  },
};

// Swap options for reveal section
type SwapOption = {
  id: string;
  label: string;
  description: string;
  savingsKg: number;
  relevantTo: string[];
  icon: string;
};

const SWAP_OPTIONS: SwapOption[] = [
  {
    id: "flight",
    label: "Explore by rail",
    description: "Pioneer a different way to see the world.",
    savingsKg: 230,
    relevantTo: ["one_short", "one_long", "two_plus", "frequent"],
    icon: "\u2708\uFE0F",
  },
  {
    id: "meat",
    label: "Redesign two meals",
    description: "Join the food innovation movement, twice a week.",
    savingsKg: 45,
    relevantTo: ["heavy_meat", "meat", "flexitarian"],
    icon: "\uD83C\uDF31",
  },
  {
    id: "transport",
    label: "Reinvent your commute",
    description: "Be part of the mobility revolution, one day a week.",
    savingsKg: 60,
    relevantTo: ["petrol", "shared"],
    icon: "\uD83D\uDEB2",
  },
  {
    id: "heat",
    label: "Go heat pump",
    description: "The smartest energy upgrade most homes can make.",
    savingsKg: 80,
    relevantTo: ["gas", "oil"],
    icon: "\uD83C\uDFE0",
  },
  {
    id: "digital",
    label: "Hack your power draw",
    description: "See the invisible energy others miss.",
    savingsKg: 15,
    relevantTo: ["US", "UK", "FR", "DE", "OTHER"],
    icon: "\uD83D\uDD0C",
  },
];

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// Component
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

type Phase = "pick" | "ripple" | "transition" | "quiz" | "reveal";

export default function NarrativePage() {
  // \u2500\u2500 Phase state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const [phase, setPhase] = useState<Phase>("pick");
  const [selectedChoice, setSelectedChoice] = useState<RippleChoice | null>(null);

  // \u2500\u2500 Ripple animation state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const [activeLevel, setActiveLevel] = useState(-1);
  const [displayNumber, setDisplayNumber] = useState(0);
  const [rippleComplete, setRippleComplete] = useState(false);
  const levelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // \u2500\u2500 Quiz state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // \u2500\u2500 Reveal state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const [signal, setSignal] = useState<{
    monthlyTCO2e: number;
    breakdown: { home: number; flights: number; food: number; digital: number };
  } | null>(null);
  const [selectedSwap, setSelectedSwap] = useState<string | null>(null);
  const [revealReady, setRevealReady] = useState(false);

  // \u2500\u2500 Email capture \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [captureStatus, setCaptureStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  // \u2500\u2500 Refs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const rippleRef = useRef<HTMLDivElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

  // \u2500\u2500 Computed \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const dominantCategory = useMemo(() => {
    if (!signal) return null;
    const b = signal.breakdown;
    const entries = [
      { key: "home", val: b.home },
      { key: "flights", val: b.flights },
      { key: "food", val: b.food },
      { key: "digital", val: b.digital },
    ];
    entries.sort((a, c) => c.val - a.val);
    return entries[0].key;
  }, [signal]);

  const revealData = dominantCategory
    ? CATEGORY_REVEAL[dominantCategory]
    : null;

  const quote = REVEAL_QUOTES[1]; // Jane Goodall

  const relevantSwaps = useMemo(() => {
    const vals = Object.values(answers);
    return SWAP_OPTIONS.filter((sw) =>
      sw.relevantTo.some((v) => vals.includes(v))
    ).slice(0, 3);
  }, [answers]);

  const swapSavingsMonthly = useMemo(() => {
    if (!selectedSwap) return 0;
    const sw = SWAP_OPTIONS.find((s) => s.id === selectedSwap);
    return sw ? sw.savingsKg / 1000 : 0;
  }, [selectedSwap]);

  // People target numbers for animation
  const PEOPLE_TARGETS = [1, 10, 1000, 500000];

  // \u2500\u2500 Ripple animation engine \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  const startRipple = useCallback(
    (choice: RippleChoice) => {
      setSelectedChoice(choice);
      setPhase("ripple");
      setActiveLevel(-1);
      setDisplayNumber(0);
      setRippleComplete(false);

      // Scroll to ripple section after brief delay
      setTimeout(() => {
        rippleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);

      // Start the level sequence
      let currentLevel = 0;

      const advanceLevel = () => {
        if (currentLevel >= 4) {
          setRippleComplete(true);
          return;
        }

        setActiveLevel(currentLevel);

        // Animate the number
        const target = PEOPLE_TARGETS[currentLevel];
        const duration = currentLevel === 0 ? 400 : 1200;
        const start = Date.now();
        const startVal = currentLevel === 0 ? 0 : PEOPLE_TARGETS[currentLevel - 1];

        if (numberTimerRef.current) clearInterval(numberTimerRef.current);

        numberTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(startVal + (target - startVal) * eased);
          setDisplayNumber(current);

          if (progress >= 1) {
            if (numberTimerRef.current) clearInterval(numberTimerRef.current);
          }
        }, 16);

        currentLevel++;
        levelTimerRef.current = setTimeout(advanceLevel, 2800);
      };

      // Start after a small delay for the phase transition
      levelTimerRef.current = setTimeout(advanceLevel, 600);
    },
    []
  );

  // Skip to end of ripple animation
  const skipRipple = useCallback(() => {
    if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
    if (numberTimerRef.current) clearInterval(numberTimerRef.current);
    setActiveLevel(3);
    setDisplayNumber(500000);
    setRippleComplete(true);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
      if (numberTimerRef.current) clearInterval(numberTimerRef.current);
    };
  }, []);

  // \u2500\u2500 Scroll reveal observer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("n-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    document
      .querySelectorAll(".n-reveal-on-scroll")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [phase, revealReady]);

  // \u2500\u2500 Handlers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  const handleTransition = useCallback(() => {
    setPhase("transition");
    setTimeout(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleStartQuiz = useCallback(() => {
    setPhase("quiz");
    setQuizStep(0);
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleQuizAnswer = useCallback(
    (value: string) => {
      const q = QUIZ_QUESTIONS[quizStep];
      const newAnswers = { ...answers, [q.questionKey]: value };
      setAnswers(newAnswers);

      // Auto-advance after short delay
      setTimeout(() => {
        if (quizStep < QUIZ_QUESTIONS.length - 1) {
          setQuizStep(quizStep + 1);
        } else {
          // Compute signal
          const answerInputs: AnswerInput[] = QUIZ_QUESTIONS.map((qq) => ({
            missionKey: qq.missionKey,
            questionKey: qq.questionKey,
            valueStr: newAnswers[qq.questionKey] ?? null,
            valueNum: null,
            valueBool: null,
          }));
          const missions: MissionStateInput[] = [
            { key: "HOME_BASELINE", status: "PARTIAL" },
            { key: "FLIGHT_QUESTION", status: "PARTIAL" },
            { key: "FOOD_CHOICES", status: "PARTIAL" },
            { key: "DIGITAL_CARBON", status: "LOCKED" },
          ];
          const result = calculateSignal({ answers: answerInputs, missions });
          setSignal({
            monthlyTCO2e: result.monthlyTCO2e,
            breakdown: result.breakdown,
          });
          setPhase("reveal");
          setTimeout(() => {
            setRevealReady(true);
            revealRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 300);
        }
      }, 400);
    },
    [quizStep, answers]
  );

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (captureStatus === "submitting" || captureStatus === "success") return;
    const trimmed = email.trim();
    if (!trimmed || !consent) return;

    setCaptureStatus("submitting");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "orbit_ripple",
          monthlyTCO2e: signal?.monthlyTCO2e,
          consent,
          selectedSwap,
          rippleChoice: selectedChoice?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setCaptureStatus("success");
    } catch {
      setCaptureStatus("error");
    }
  }

  const currentQ = QUIZ_QUESTIONS[quizStep];

  // Format number with commas
  const formatNum = (n: number) => n.toLocaleString("en-US");

  // Calculate ripple savings for display
  const rippleSavings = selectedChoice
    ? {
        you: `${selectedChoice.monthlySavingsKg * 12} kg`,
        ten: `${((selectedChoice.monthlySavingsKg * 12 * 10) / 1000).toFixed(1)} tonnes`,
        thousand: `${Math.round(
          (selectedChoice.monthlySavingsKg * 12 * 1000) / 1000
        )} tonnes`,
        city: `${formatNum(
          Math.round((selectedChoice.monthlySavingsKg * 12 * 500000) / 1000)
        )} tonnes`,
      }
    : null;

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  // Render
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

  return (
    <div className="n-page" ref={pageTopRef}>
      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PHASE 1: PICK */}
      {phase === "pick" && (
        <section className="r-pick">
          <div className="r-pick-inner">
            <div className="r-pick-badge">
              <span className="r-pick-dot" />
              THE RIPPLE EFFECT
            </div>
            <h1 className="r-pick-headline">
              One bold move.
              <br />
              <span className="n-italic">See the future you{"\u2019"}re building.</span>
            </h1>
            <p className="r-pick-sub">
              Every system-level change starts with one person who chose to do
              something differently. Pick yours.
            </p>

            <div className="r-choices">
              {RIPPLE_CHOICES.map((choice) => (
                <button
                  key={choice.id}
                  className="r-choice-card"
                  style={
                    { "--card-accent": choice.color } as React.CSSProperties
                  }
                  onClick={() => startRipple(choice)}
                >
                  <span className="r-choice-icon">{choice.icon}</span>
                  <span className="r-choice-label">{choice.label}</span>
                  <span className="r-choice-tagline">{choice.tagline}</span>
                </button>
              ))}
            </div>

            <div className="r-pick-credit">
              Data: <strong>The Carbon Almanac</strong> &middot; Penguin Random
              House, 2022
            </div>
          </div>
        </section>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PHASE 2: RIPPLE */}
      {phase === "ripple" && selectedChoice && (
        <section className="r-ripple" ref={rippleRef}>
          <div className="r-ripple-inner">
            {/* Concentric ring visualization */}
            <div className="r-rings-container">
              <div className="r-rings">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`r-ring r-ring-${i} ${
                      activeLevel >= i ? "active" : ""
                    }`}
                    style={
                      {
                        "--ring-color": RING_COLORS[i],
                        "--ring-delay": `${i * 0.15}s`,
                      } as React.CSSProperties
                    }
                  />
                ))}
                {/* Center icon */}
                <div className={`r-center-icon ${activeLevel >= 0 ? "active" : ""}`}>
                  {selectedChoice.icon}
                </div>
              </div>

              {/* People counter */}
              <div className="r-people-counter">
                <span className="r-people-num">{formatNum(displayNumber)}</span>
                <span className="r-people-label">
                  {activeLevel >= 0
                    ? activeLevel === 0
                      ? "person"
                      : "people"
                    : ""}
                </span>
              </div>

              {/* Level label */}
              {activeLevel >= 0 && (
                <div className="r-level-label" key={`label-${activeLevel}`}>
                  {RING_LABELS[activeLevel]}
                </div>
              )}
            </div>

            {/* Fact card */}
            {activeLevel >= 0 && (
              <div className="r-fact-card" key={`fact-${activeLevel}`}>
                <p className="r-fact-body">
                  {selectedChoice.levels[activeLevel].fact}
                </p>
                <div className="r-fact-credit">
                  {"\uD83D\uDCD6"} {selectedChoice.levels[activeLevel].factSource}
                </div>
              </div>
            )}

            {/* Skip / Continue buttons */}
            <div className="r-ripple-actions">
              {!rippleComplete && (
                <button
                  className="r-skip-btn"
                  onClick={skipRipple}
                >
                  Skip to full ripple {"\u2192"}
                </button>
              )}
              {rippleComplete && (
                <button
                  className="n-btn n-btn-mint"
                  onClick={handleTransition}
                >
                  That{"\u2019"}s my move. What{"\u2019"}s next?
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PHASE 3: TRANSITION */}
      {phase === "transition" && selectedChoice && rippleSavings && (
        <section className="r-transition">
          <div className="r-transition-inner">
            <div className="r-transition-emoji">{selectedChoice.icon}</div>
            <h2 className="r-transition-headline">
              Your move:{" "}
              <span className="r-transition-highlight">
                {selectedChoice.label.toLowerCase()}
              </span>
            </h2>

            <div className="r-transition-stats">
              <div className="r-stat">
                <span className="r-stat-num">{rippleSavings.you}</span>
                <span className="r-stat-label">your impact each year</span>
              </div>
              <div className="r-stat">
                <span className="r-stat-num">{rippleSavings.city}</span>
                <span className="r-stat-label">when a city follows your lead</span>
              </div>
            </div>

            <p className="r-transition-body">
              That{"\u2019"}s one move. Now let{"\u2019"}s find{" "}
              <em>your arena</em> {"\u2014"} the place where you
              can shape the future most.
            </p>

            <button className="n-btn n-btn-mint" onClick={handleStartQuiz}>
              Find my arena
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <p className="r-transition-time">5 questions. Under 2 minutes. Zero judgment.</p>
          </div>
        </section>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PHASE 4: QUIZ */}
      {phase === "quiz" && currentQ && (
        <section className="r-quiz" ref={quizRef}>
          <div className="r-quiz-inner">
            <div className="r-quiz-progress-wrap">
              <div className="r-quiz-progress">
                <div
                  className="r-quiz-progress-fill"
                  style={{
                    width: `${((quizStep + (answers[currentQ.questionKey] ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
              <span className="r-quiz-step">
                {quizStep + 1} of {QUIZ_QUESTIONS.length}
              </span>
            </div>

            <div className="r-quiz-card" key={`q-${currentQ.id}`}>
              <h2 className="r-quiz-prompt">{currentQ.prompt}</h2>
              <p className="r-quiz-subtext">{currentQ.subtext}</p>

              <div className="r-quiz-options">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    className={`r-quiz-option ${
                      answers[currentQ.questionKey] === opt.value
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleQuizAnswer(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PHASE 5: REVEAL */}
      {phase === "reveal" && signal && revealData && (
        <>
          <section className="r-reveal" ref={revealRef}>
            <div className="r-reveal-inner">
              <div className="r-reveal-emoji">{revealData.emoji}</div>
              <div className="r-reveal-category">{revealData.label}</div>
              <h2 className="r-reveal-headline">{revealData.headline}</h2>
              <p className="r-reveal-body">{revealData.body}</p>

              {/* Breakdown visual */}
              <div className="r-breakdown">
                {[
                  {
                    key: "home",
                    label: "Home",
                    value: signal.breakdown.home,
                    color: "var(--mint)",
                  },
                  {
                    key: "flights",
                    label: "Flights",
                    value: signal.breakdown.flights,
                    color: "var(--cyan)",
                  },
                  {
                    key: "food",
                    label: "Food",
                    value: signal.breakdown.food,
                    color: "var(--sky)",
                  },
                  {
                    key: "digital",
                    label: "Digital",
                    value: signal.breakdown.digital,
                    color: "var(--glow)",
                  },
                ]
                  .filter((b) => b.value > 0)
                  .map((b) => {
                    const total =
                      signal.breakdown.home +
                      signal.breakdown.flights +
                      signal.breakdown.food +
                      signal.breakdown.digital;
                    const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
                    return (
                      <div
                        key={b.key}
                        className={`r-bar-row ${
                          b.key === dominantCategory ? "dominant" : ""
                        }`}
                      >
                        <span className="r-bar-label">{b.label}</span>
                        <div className="r-bar-track">
                          <div
                            className="r-bar-fill"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: b.color,
                            }}
                          />
                        </div>
                        <span className="r-bar-pct">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>

          {/* \u2500\u2500 Start Your Ripple (swap section) \u2500\u2500 */}
          <section className="r-swap n-reveal-on-scroll">
            <div className="r-swap-inner">
              <h3 className="r-swap-headline">Make your first move.</h3>
              <p className="r-swap-subtext">
                Pick one thing you{"\u2019"}d actually do. See what happens when
                one person leads{"\u2014"}and others follow.
              </p>

              <div className="r-swap-options">
                {relevantSwaps.map((sw) => (
                  <button
                    key={sw.id}
                    className={`r-swap-btn ${
                      selectedSwap === sw.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelectedSwap(
                        selectedSwap === sw.id ? null : sw.id
                      )
                    }
                  >
                    <span className="r-swap-icon">{sw.icon}</span>
                    <span className="r-swap-label">{sw.label}</span>
                  </button>
                ))}
              </div>

              {selectedSwap && (
                <div className="r-swap-result">
                  <p className="r-swap-description">
                    {SWAP_OPTIONS.find((s) => s.id === selectedSwap)?.description}
                  </p>
                  <div className="r-swap-impact">
                    <div className="r-impact-row">
                      <span className="r-impact-label">You</span>
                      <span className="r-impact-value">
                        {(
                          (SWAP_OPTIONS.find((s) => s.id === selectedSwap)
                            ?.savingsKg ?? 0) * 12
                        ).toLocaleString()}{" "}
                        kg/year
                      </span>
                    </div>
                    <div className="r-impact-row">
                      <span className="r-impact-label">1,000 people</span>
                      <span className="r-impact-value r-impact-highlight">
                        {Math.round(
                          ((SWAP_OPTIONS.find((s) => s.id === selectedSwap)
                            ?.savingsKg ?? 0) *
                            12 *
                            1000) /
                            1000
                        ).toLocaleString()}{" "}
                        tonnes/year
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* \u2500\u2500 Almanac Quote \u2500\u2500 */}
          <section className="r-quote n-reveal-on-scroll">
            <div className="r-quote-inner">
              <blockquote>
                <p>
                  {"\u201C"}
                  {quote.text}
                  {"\u201D"}
                </p>
                <cite>
                  {"\u2014"} {quote.attribution}
                </cite>
              </blockquote>
              <div className="r-quote-credit">
                From <strong>The Carbon Almanac</strong> &middot; Partner of The
                Spaceship Academy
              </div>
            </div>
          </section>

          {/* \u2500\u2500 Thrive Lab Bridge \u2500\u2500 */}
          <section className="r-bridge n-reveal-on-scroll">
            <div className="r-bridge-inner">
              <div className="r-bridge-kicker">
                INNOVATION FOR PEOPLE AND PLANETS
              </div>
              <h3>
                Ready to build?{" "}
                <span className="n-italic">Thrive Lab</span> is where future
                shapers go to work.
              </h3>
              <p>
                One week at The Hun School of Princeton. Systems thinking,
                planetary boundaries, and the tools to turn insight into
                innovation. For the next generation of changemakers.
                Grades 9{"\u2013"}12. Summer 2026.
              </p>
              <a
                className="n-btn n-btn-mint"
                href="https://www.hunschool.org/summer/summer-leadership-institute"
                target="_blank"
                rel="noreferrer"
              >
                Join Thrive Lab
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </section>

          {/* \u2500\u2500 Email Capture \u2500\u2500 */}
          <section className="r-capture n-reveal-on-scroll">
            <div className="r-capture-inner">
              {captureStatus === "success" ? (
                <div className="r-capture-done">
                  <h3>You{"\u2019"}re in.</h3>
                  <p>Your first future-shaper briefing lands Sunday.</p>
                </div>
              ) : (
                <>
                  <h3>Stay in the loop.</h3>
                  <p>
                    One email a week. New ideas, new innovations, new ways to
                    shape what{"\u2019"}s next.
                  </p>
                  <form
                    className="r-capture-form"
                    onSubmit={handleCapture}
                    noValidate
                  >
                    <div className="r-capture-row">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@somewhere.earth"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={captureStatus === "submitting"}
                      />
                      <button
                        type="submit"
                        className="n-btn n-btn-mint"
                        disabled={captureStatus === "submitting"}
                      >
                        {captureStatus === "submitting"
                          ? "Sending\u2026"
                          : "Send my report"}
                      </button>
                    </div>
                    <label className="r-capture-consent">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span>
                        Yes, send me the weekly future-shaper briefing.
                        Unsubscribe any time.
                      </span>
                    </label>
                  </form>
                </>
              )}
            </div>
          </section>
        </>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 FOOTER */}
      <footer className="n-footer">
        <div className="n-footer-inner">
          <span>
            Powered by <strong>The Carbon Almanac</strong>
          </span>
          <span className="n-footer-sep">&middot;</span>
          <span>
            Built by <strong>The Spaceship Academy</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
