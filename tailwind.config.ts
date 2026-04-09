import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        surface: "#0d1b2f",
        panel: "#13233c",
        line: "#22395a",
        glow: "#7dd3fc",
        gold: "#fbbf24",
        coral: "#fb7185",
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Outfit'", "sans-serif"],
      },
      boxShadow: {
        card: "0 24px 60px rgba(8, 15, 29, 0.45)",
        glow: "0 0 0 1px rgba(125, 211, 252, 0.22), 0 20px 45px rgba(12, 74, 110, 0.28)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top left, rgba(125, 211, 252, 0.24), transparent 32%), radial-gradient(circle at top right, rgba(251, 113, 133, 0.16), transparent 28%), linear-gradient(135deg, rgba(10,18,31,1) 0%, rgba(14,27,47,1) 42%, rgba(8,18,32,1) 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseLine: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseLine: "pulseLine 1.8s ease-in-out infinite",
        slideUp: "slideUp 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
