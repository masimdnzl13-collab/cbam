import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#16181d",
          surface: "#1f232b",
          surface2: "#262b35",
          border: "#333a46",
          borderMuted: "#262b35",
        },
        ink: {
          DEFAULT: "#e8eaed",
          muted: "#9aa3b2",
          faint: "#6b7280",
        },
        accent: {
          DEFAULT: "#ff6b35",
          hover: "#ff8555",
          muted: "#7a3a20",
        },
        steel: {
          DEFAULT: "#5b8dbe",
          hover: "#75a3d1",
          muted: "#2e4459",
        },
        success: {
          DEFAULT: "#3ecf8e",
          muted: "#1f5c42",
        },
        warning: {
          DEFAULT: "#f2b134",
          muted: "#6b4d13",
        },
        danger: {
          DEFAULT: "#e5484d",
          muted: "#5c2224",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "6px",
        xl: "6px",
        full: "9999px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
