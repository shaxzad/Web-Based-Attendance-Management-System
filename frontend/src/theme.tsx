import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#0033a0" },
        },
        primary: {
          50: { value: "#e6f0ff" },
          100: { value: "#b3d1ff" },
          200: { value: "#80b3ff" },
          300: { value: "#4d94ff" },
          400: { value: "#1a75ff" },
          500: { value: "#0033a0" },
          600: { value: "#002b8a" },
          700: { value: "#002373" },
          800: { value: "#001b5c" },
          900: { value: "#001345" },
        },
        brand: {
          primary: { value: "#0033a0" },
          secondary: { value: "#ffffff" },
          accent: { value: "#f0f4ff" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
