import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102a2b",
        moss: "#245c4f",
        leaf: "#3f8f77",
        mist: "#eef7f4",
        sand: "#f5efe2",
        ember: "#b45f06"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(16, 42, 43, 0.08)"
      },
      backgroundImage: {
        "dashboard-grid":
          "linear-gradient(rgba(36, 92, 79, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(36, 92, 79, 0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
