import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1220",
          900: "#12203D",
          800: "#1B2E52",
          700: "#26406B",
        },
        parchment: {
          50: "#FAF9F6",
          100: "#F3F1EA",
        },
        gold: {
          400: "#C79A44",
          500: "#B98B3E",
          600: "#9C7431",
        },
        signal: {
          error: "#B3392C",
          success: "#3E7A4C",
        },
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
