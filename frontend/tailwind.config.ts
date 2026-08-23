import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#22c55e",
          moderate: "#f59e0b",
          high: "#ef4444",
          extreme: "#7f1d1d",
        },
        brand: {
          primary: "#1e3a5f",
          accent: "#38bdf8",
        },
      },
    },
  },
};

export default config;
