import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0E14", // fundo grafite-azulado, quase preto
          surface: "#12161F",
          raised: "#1A1F2B",
          border: "#252B39"
        },
        ink: {
          DEFAULT: "#E7EAF0",
          muted: "#8B93A7",
          faint: "#5B6479"
        },
        signal: {
          gold: "#FFB020",   // escalando / vencedor
          teal: "#33C7B0",   // pre-escala / estavel
          coral: "#FF5D5D",  // pausado / reprovado
          violet: "#8B7CF6"  // em teste
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        "belt-dashes":
          "repeating-linear-gradient(90deg, var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
};
export default config;
