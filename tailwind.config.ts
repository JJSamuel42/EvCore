import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      colors: {
        background: "#FAFAF8",
        foreground: "#1A1A1A",
        muted: "#F5F3F0",
        "muted-foreground": "#6B6B6B",
        accent: "#1C5E5E",
        "accent-secondary": "#2A8080",
        "accent-foreground": "#FFFFFF",
        "accent-muted": "rgba(28,94,94,0.06)",
        border: "#E8E4DF",
        "border-hover": "#C8C4BF",
        card: "#FFFFFF",
        ring: "#1C5E5E",
        input: "#E8E4DF",
        // Status colors
        include: "#166534",
        "include-bg": "#F0FDF4",
        exclude: "#991B1B",
        "exclude-bg": "#FEF2F2",
        // PICO colors
        pico: {
          p: "#1D4ED8",
          "p-bg": "#EFF6FF",
          i: "#7C3AED",
          "i-bg": "#F5F3FF",
          c: "#0F766E",
          "c-bg": "#F0FDFA",
          o: "#B45309",
          "o-bg": "#FFFBEB",
        },
      },
      boxShadow: {
        sm: "0 1px 2px rgba(26,26,26,0.04)",
        md: "0 4px 12px rgba(26,26,26,0.06)",
        lg: "0 8px 24px rgba(26,26,26,0.08)",
        accent: "0 4px 12px rgba(28,94,94,0.15)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#1A1A1A",
            maxWidth: "65ch",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
