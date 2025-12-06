import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        tzuchiBlue: "#005a9c",
        tzuchiGold: "#cfae70"
      }
    }
  },
  plugins: []
};

export default config;


