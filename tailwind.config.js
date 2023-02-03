module.exports = {
  plugins: [
    require("@tailwindcss/typography"),
    require('daisyui')
  ],
  theme: {
    colors: {
      "urfist-50": "#e85724", 
      "urfist-100": "#F29F20", 
      "urfist-200": "#FAAF5E", 
      "urfist-300": "#FFDFB2", 
      "urfist-400": "#FEEDD4", 
      "urfist-500": "#C7E8FA", 
      "urfist-600": "#9DB8CD", 
      "urfist-700": "#D3C0A7", 
      "urfist-800": "#FEF8EF", 
      "primary-50-kv3": "#000000",
      "primary-100-kv3": "#11192C",
      "primary-200-kv3": "#242F46",
      "primary-300-kv3": "#39445A",
      "primary-400-kv3": "#56647F",
      "primary-500-kv3": "#8B99B1",
      "primary-600-kv3": "#C5D0E0",
      "primary-700-kv3": "#E0E6ED",
      "primary-800-kv3": "#EBEFF4",
      "primary-900-kv3": "#F8F9FC",
    },
  },
  daisyui: {
    themes: [
      "autumn",
      "light",
      {
        urfist: {
          primary: "#39445A",
          "primary-focus": "#11192C",
          "primary-content": "#F8F9FC",
          secondary: "#EBEFF4",
          "secondary-focus": "#F8F9FC",
          "secondary-content": "#242F46",
          accent: "#FEEDD4",
          "accent-focus": "#FAAF5E",
          "accent-content": "#11192C",
          neutral: "#C7E8FA",
          "neutral-content": "#11192C",
          "base-100": "#FCFCFC",
          info: "#E1FF67",
          success: "#3CCA83",
          error: "#FF9393"
        }
      },
    ]
  }
};
