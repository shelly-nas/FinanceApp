import { ThemeOptions } from "@mui/material/styles";
import "@/expanded-theme";

export const tokens = {
    grey: {
      100: "#f0f0f3",
      200: "#e1e2e7",
      300: "#d1d3da",
      400: "#c2c5ce",
      500: "#b3b6c2",
      600: "#8f929b",
      700: "#6b6d74",
      800: "#48494e",
      900: "#242427",
    },
    primary: {
      // light green
      100: "#d0fcf4",
      200: "#a0f9e9",
      300: "#71f5de",
      400: "#41f2d3",
      500: "#12efc8",
      600: "#0ebfa0",
      700: "#0b8f78",
      800: "#076050",
      900: "#043028",
    },
    secondary: {
      // yellow
      100: "#fcf0dd",
      200: "#fae1bb",
      300: "#f7d299",
      400: "#f5c377",
      500: "#f2b455",
      600: "#c29044",
      700: "#916c33",
      800: "#614822",
      900: "#302411",
    },
    background: {
      light: "#ffffff",
      main: "#fbfbfb",
    },
  };
  
  // mui theme settings
  export const themeSettings: ThemeOptions = {
    palette: {
      primary: {
        ...tokens.primary,
        main: tokens.primary[600],
        light: tokens.primary[500],
      },
      secondary: {
        ...tokens.secondary,
        main: tokens.secondary[500],
      },
      grey: {
        ...tokens.grey,
      },
      background: {
        default: tokens.background.main,
        light: tokens.background.light,
      },
      cosmetics: {
        radius: 5,
        colorPrimary: tokens.grey[200],
        colorSecondary: tokens.grey[100],
        width: 1,
        borderStyle: "Solid",
        spacing: 1
      }
    },
    typography: {
      fontFamily: ["Reddit Mono", "monospace"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 32,
        fontWeight: "bold",
        color: tokens.grey[800],
      },
      h2: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 13,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: tokens.grey[800],
      },
      h3: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 13,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: tokens.grey[600],
      },
      body1: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: tokens.grey[800],
      },
      body2: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: tokens.grey[800],
      },
      body3: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: tokens.grey[600],
      },
      credit: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: tokens.primary[600],
      },
      debit: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: "#E35335",
      },
    },
  };