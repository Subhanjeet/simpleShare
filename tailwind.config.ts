import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090D16",
        surface: {
          DEFAULT: "#111827",
          muted: "#1F2937",
          border: "#1E293B",
        },
        brand: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          light: "#60A5FA",
          50: "#1E3A8A",
          100: "#1E40AF",
        },
        accent: {
          sky: "#38BDF8",
          emerald: "#10B981",
          rose: "#EF4444",
          amber: "#F59E0B",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        elevated: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
