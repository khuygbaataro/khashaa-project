/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F4EFE6",
        paper: "#FFFFFF",
        ink: "#1F1A15",
        "ink-soft": "#6B6258",
        "ink-muted": "#9A8F82",
        terracotta: "#B85540",
        "terracotta-dark": "#9C4533",
        forest: "#3D5A40",
        border: "#E5DDC9",
        "border-strong": "#D4C7AE",
        warning: "#C68B2A",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        body: ['"Inter Tight"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      letterSpacing: {
        display: "-0.02em",
      },
    },
  },
  plugins: [],
};
