/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#6D28D9",
          blue: "#2563EB",
          dark: "#0F172A",
          light: "#F3E8FF",
          white: "#FFFFFF",
          // Preserve existing active brand accent #FF6A2B as requested
          accent: "#FF6A2B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-manrope)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
