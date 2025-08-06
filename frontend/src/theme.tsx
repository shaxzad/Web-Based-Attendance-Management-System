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
          main: { value: "#01411C" },
        },
        primary: {
          50: { value: "#e6f0e6" },
          100: { value: "#b3d1b3" },
          200: { value: "#80b380" },
          300: { value: "#4d944d" },
          400: { value: "#1a751a" },
          500: { value: "#01411C" },
          600: { value: "#013a19" },
          700: { value: "#013316" },
          800: { value: "#002c13" },
          900: { value: "#002510" },
        },
        brand: {
          primary: { value: "#01411C" },
          secondary: { value: "#ffffff" },
          accent: { value: "#f0f4f0" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
