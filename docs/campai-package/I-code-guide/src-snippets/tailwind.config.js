// AI note: Tailwind design tokens for campAI (colour, type, spacing, radius, shadow, breakpoints) from C-ux-spec.md. Bolt's scaffold already has this file; replace its `theme` with this.
// Destination: tailwind.config.js (repository root). Owner: Bolt (from prompt G). Claude Code only touches it for token fixes while Bolt is idle.

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0a0a0a", raised: "#111111", sunken: "#050505" },
        surface: { DEFAULT: "#141414", hover: "#1a1a1a", active: "#202020" },
        line: { DEFAULT: "#262626", strong: "#333333", subtle: "#1c1c1c" },
        ink: { DEFAULT: "#f4f4f2", secondary: "#a3a3a3", muted: "#737373", inverse: "#0a0a0a" },
        accent: { DEFAULT: "#c9a86a", hover: "#d8b97c", soft: "rgba(201,168,106,0.12)" },
        state: { success: "#6fbf8a", warning: "#d9a441", danger: "#e06c6c", info: "#7fa7d9" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.125rem", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      spacing: { 18: "4.5rem", 22: "5.5rem", 30: "7.5rem" },
      borderRadius: { sm: "6px", DEFAULT: "8px", md: "10px", lg: "12px", xl: "16px" },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)",
        focus: "0 0 0 2px #0a0a0a, 0 0 0 4px #c9a86a",
      },
      transitionDuration: { fast: "120ms", base: "180ms", slow: "260ms" },
      maxWidth: { content: "72rem", prose: "42rem" },
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
    },
  },
  plugins: [],
};
