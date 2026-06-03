/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./web/public/**/*.html",
    "./web/public/**/*.js",
    "./web/public/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        slime: {
          bg: "#050705",
          panel: "#0a110c",
          soft: "#111d13",
          green: "#72ff23",
          strong: "#bbff63",
          dim: "rgba(114, 255, 35, 0.18)",
          red: "#ff5d5d",
          yellow: "#ffe56d",
          text: "#f5fff2",
          muted: "#9bad96"
        }
      },
      borderRadius: {
        slime: "12px"
      },
      boxShadow: {
        slime: "0 0 24px rgba(114, 255, 35, 0.22)",
        terminal: "0 22px 80px rgba(0, 0, 0, 0.36)"
      }
    },
  },
  plugins: [],
}
