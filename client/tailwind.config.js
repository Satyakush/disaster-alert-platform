/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        card: "#111827",
        primary: "#6366F1",
        accent: "#22D3EE",
        muted: "#9CA3AF",
      },
      boxShadow: {
        soft: "0 10px 40px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
