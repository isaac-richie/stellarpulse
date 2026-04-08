/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/web/app/**/*.{js,ts,jsx,tsx}",
    "./apps/web/components/**/*.{js,ts,jsx,tsx}",
    "./apps/web/lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "var(--bg-base)",
        "bg-surface": "var(--bg-surface)",
        "bg-elevated": "var(--bg-elevated)",
        "ink-primary": "var(--ink-primary)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-muted": "var(--ink-muted)",
        "accent-primary": "var(--accent-primary)",
        "accent-secondary": "var(--accent-secondary)",
        "success": "var(--success)",
        "error": "var(--error)",
        "border-subtle": "var(--border-subtle)",
        "border-medium": "var(--border-medium)",
        "border-strong": "var(--border-strong)"
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
