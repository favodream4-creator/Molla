import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        molla: {
          black: "#0B0D10",
          white: "#FFFFFF",
          yellow: "#FFD21F",
          blue: "#1769FF",
          gray: "#F3F5F7",
          line: "#E7EAEE",
          sub: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Manrope", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
