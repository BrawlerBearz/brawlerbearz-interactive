/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html,css}"],
  mode: "jit",
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        invisible: "rgba(1,1,1,0)",
        current: "currentColor",
        primary: "#fff",
        accent: "#77cf49",
        main: "#142b42",
        dark: "#08111b",
        dark2: "#0a121a",
        dusty: "#39342d",
        error: "#ea3131",
        warn: "#ffbb00",
        accent2: "#165763",
        accent3: "#1d7e8d",
        accent4: "#5fefcf",
        accent5: "#d635c6",
        accent6: "#ea3131",
        accent7: "#ffffff",
        accent8: "#ffbb00",
        accent9: "#fff4f8",
        ironbearz: "#0484d1",
        pawpunkz: "#762bfb",
        geoscapez: "#fb922b",
        techheadz: "#afbfd2",
        mapwater: "#23356b",
      },
      fontFamily: {
        primary: ["PressStart2P", "sans-serif"],
      },
      screens: {
        tablet: "499px",
        laptop: "1024px",
        desktop: "1280px",
      },
      boxShadow: {
        pixel:
          "-3px 0 0 0 #142b42, 3px 0 0 0 #142b42, 0 -3px 0 0 #142b42, 0 3px 0 0 #142b42",
        pixelMain:
          "-3px 0 0 0 #142b42, 3px 0 0 0 #142b42, 0 -3px 0 0 #142b42, 0 3px 0 0 #142b42",
        pixelAccent:
          "-3px 0 0 0 #77cf49, 3px 0 0 0 #77cf49, 0 -3px 0 0 #77cf49, 0 3px 0 0 #77cf49",
        pixelWhite:
          "-3px 0 0 0 #cdc9c5, 3px 0 0 0 #cdc9c5, 0 -3px 0 0 #cdc9c5, 0 3px 0 0 #cdc9c5",
      },
    },
  },
  plugins: [],
};
