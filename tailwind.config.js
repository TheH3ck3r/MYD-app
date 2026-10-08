/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./ui/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-pressed": "rgb(var(--color-primary-pressed) / <alpha-value>)",
        "primary-foreground":
          "rgb(var(--color-primary-foreground) / <alpha-value>)",

        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        "secondary-pressed":
          "rgb(var(--color-secondary-pressed) / <alpha-value>)",
        "secondary-foreground":
          "rgb(var(--color-secondary-foreground) / <alpha-value>)",

        success: "rgb(var(--color-success) / <alpha-value>)",

        failed: "rgb(var(--color-failed) / <alpha-value>)",

        error: "rgb(var(--color-error) / <alpha-value>)",

        "error-foreground":
          "rgb(var(--color-error-foreground) / <alpha-value>)",

        background: "rgb(var(--color-background) / <alpha-value>)",

        surface: "rgb(var(--color-surface) / <alpha-value>)",

        "surface-elevated":
          "rgb(var(--color-surface-elevated) / <alpha-value>)",

        border: "rgb(var(--color-border) / <alpha-value>)",

        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "muted-foreground":
          "rgb(var(--color-muted-foreground) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
