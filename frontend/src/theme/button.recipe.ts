import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    colorPalette: "primary",
  },
  variants: {
    variant: {
      ghost: {
        bg: "transparent",
        _hover: {
          bg: "gray.100",
        },
      },
      inverse: {
        bg: "white",
        color: "brand.primary",
        border: "2px solid",
        borderColor: "brand.primary",
        _hover: {
          bg: "primary.50",
          color: "brand.primary",
          borderColor: "brand.primary",
        },
      },
    },
  },
})
