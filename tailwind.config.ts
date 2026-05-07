import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // McKenzie brand blue (per Ryan's feedback). Configurable per AOC client.
        brand: {
          DEFAULT: "#00a7e0",
          50: "#e6f7fd",
          100: "#cdeffb",
          200: "#9bdff7",
          300: "#69cff3",
          400: "#37bfef",
          500: "#00a7e0",
          600: "#0086b3",
          700: "#006486",
          800: "#00435a",
          900: "#00212d",
        },
        ink: {
          DEFAULT: "#0f172a",
          subtle: "#475569",
          muted: "#94a3b8",
        },
        canvas: {
          DEFAULT: "#fafaf9",
          card: "#ffffff",
          border: "#e2e8f0",
        },
        status: {
          placed: "#16a34a",
          pending: "#d97706",
          lost: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
