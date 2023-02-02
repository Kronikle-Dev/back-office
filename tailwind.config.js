module.exports = {
  plugins: [
    require("@tailwindcss/typography"),
    require('daisyui')
  ],
  daisyui: {
    themes: [
      "autumn",
      "light",
      {
        urfist: {
          "corp-50": "#e85724", 
          "corp-100": "#F29F20", 
          "corp-200": "#FAAF5E", 
          "corp-300": "#FFDFB2", 
          "corp-400": "#FEEDD4", 
          "corp-500": "#C7E8FA", 
          "corp-600": "#9DB8CD", 
          "corp-700": "#D3C0A7", 
          "corp-800": "#FEF8EF", 
          "primary-50": "#000000",
          "primary-100": "#11192C",
          "primary-200": "#242F46",
          "primary-300": "#39445A",
          "primary-400": "#56647F",
          "primary-500": "#8B99B1",
          "primary-600": "#C5D0E0",
          "primary-700": "#E0E6ED",
          "primary-800": "#EBEFF4",
          "primary-900": "#F8F9FC",
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
