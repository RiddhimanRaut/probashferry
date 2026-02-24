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
        paper: "#F5F0E8",
        charcoal: "#1A1A1A",
        terracotta: { DEFAULT: "#C45A3C", light: "#D4735A", dark: "#A84830" },
        mustard: { DEFAULT: "#D4A843", light: "#E0BE6A", dark: "#B8912E" },
        sindoor: "#A52422",
        sage: { DEFAULT: "#7A8B6F", light: "#9AAD8F", dark: "#5F6D56" },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        bengali: ["var(--font-noto-bengali)", "serif"],
      },
      keyframes: {
        nudge: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-6px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        nudge: "nudge 2s ease-in-out infinite",
        "fade-up": "fade-up 1s ease-out 0.2s both",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "#1A1A1A",
            "--tw-prose-headings": "#1A1A1A",
            "--tw-prose-links": "#C45A3C",
            "--tw-prose-bold": "#1A1A1A",
            "--tw-prose-quotes": "#C45A3C",
            "--tw-prose-quote-borders": "#D4A843",
            maxWidth: "65ch",
            a: { color: "#C45A3C", textDecoration: "underline", textUnderlineOffset: "3px", "&:hover": { color: "#A84830" } },
            blockquote: { borderLeftColor: "#D4A843", fontStyle: "italic" },
            h1: { fontFamily: "var(--font-playfair), serif" },
            h2: { fontFamily: "var(--font-playfair), serif" },
            h3: { fontFamily: "var(--font-playfair), serif" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
