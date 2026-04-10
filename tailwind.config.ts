import type { Config } from "tailwindcss";

// Orbit v2 — Spaceship brand aligned tokens
// All colours are also exposed as CSS custom properties in app/globals.css
// so that non-Tailwind rules (animations, gradients, SVG fills) share them.

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Atmospheric backgrounds
        bg: {
          DEFAULT: "#030714",
          1: "#060D1C",
          2: "#0A1323",
          3: "#0F1B2F"
        },
        // Ink — text on space
        ink: {
          0: "#FFFFFF",
          1: "#F8FAFC",
          2: "#CBD5E1",
          3: "#94A3B8",
          4: "#64748B",
          5: "#475569"
        },
        // Signal — mint gradient family
        mint: {
          1: "#A7F3D0",
          2: "#99F6E4",
          DEFAULT: "#5EEAD4",
          3: "#2DD4BF",
          4: "#14B8A6"
        },
        cyan: {
          DEFAULT: "#22D3EE"
        },
        sky: {
          DEFAULT: "#7DD3FC"
        },
        // Warm — used sparingly for "lit / fair share" accents
        glow: {
          DEFAULT: "#FEF3C7",
          2: "#FDE68A"
        }
      },
      fontFamily: {
        display: ["Satoshi", "system-ui", "sans-serif"],
        ui: ["General Sans", "Satoshi", "system-ui", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.028em",
        "eyebrow": "0.22em"
      },
      borderRadius: {
        orbit: "24px"
      },
      boxShadow: {
        "mint-glow": "0 0 32px rgba(94, 234, 212, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 -8px 14px rgba(16, 72, 65, 0.22)",
        "mint-glow-hover": "0 0 42px rgba(94, 234, 212, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -8px 14px rgba(16, 72, 65, 0.22)",
        "panel": "0 12px 50px rgba(3, 7, 20, 0.6), 0 0 30px rgba(94, 234, 212, 0.08)"
      },
      animation: {
        "twinkle": "twinkle 12s ease-in-out infinite",
        "pulse-core": "pulse-core 3.6s ease-in-out infinite",
        "drift-r": "drift-r 120s linear infinite",
        "drift-l": "drift-l 160s linear infinite",
        "rotate-slow": "rotate-slow 180s linear infinite",
        "live-blink": "live-blink 2.2s ease-in-out infinite",
        "reveal": "reveal 1s cubic-bezier(.22,.8,.35,1) forwards"
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "0.82" }
        },
        "pulse-core": {
          "0%, 100%": {
            filter:
              "drop-shadow(0 0 10px rgba(94, 234, 212, 0.75)) drop-shadow(0 0 26px rgba(94, 234, 212, 0.45))"
          },
          "50%": {
            filter:
              "drop-shadow(0 0 16px rgba(94, 234, 212, 1)) drop-shadow(0 0 38px rgba(94, 234, 212, 0.7))"
          }
        },
        "drift-r": {
          "0%": { transform: "translate3d(0,0,0) rotate(-3deg)" },
          "100%": { transform: "translate3d(calc(100vw + 360px), -60px, 0) rotate(3deg)" }
        },
        "drift-l": {
          "0%": { transform: "translate3d(0,0,0) rotate(4deg)" },
          "100%": { transform: "translate3d(calc(-100vw - 360px), 40px, 0) rotate(-2deg)" }
        },
        "rotate-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "live-blink": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" }
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
