import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    base: "var(--bg-base)",
                    surface: "var(--bg-surface)",
                    elevated: "var(--bg-elevated)",
                },
                ink: {
                    primary: "var(--ink-primary)",
                    secondary: "var(--ink-secondary)",
                    muted: "var(--ink-muted)",
                },
                accent: {
                    primary: "var(--accent-primary)",
                    secondary: "var(--accent-secondary)",
                },
                success: "var(--success)",
                error: "var(--error)",
            },
            fontFamily: {
                inter: ["var(--font-inter)", "Inter", "sans-serif"],
                outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
            },
            backgroundImage: {
                "glass-gradient": "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
            },
        },
    },
    plugins: [],
};

export default config;
