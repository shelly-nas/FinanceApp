import { PaletteMode } from "@mui/material";
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

  // Dark mode reuses the same hues but flips the grey ramp so that the
  // low keys stay "closest to the text colour" and the high keys stay
  // "closest to the surface", which is how components consume them.
  const darkGrey = {
    100: "#e6e7ea",
    200: "#c9cbd1",
    300: "#a7aab3",
    400: "#878b95",
    500: "#6b6f79",
    600: "#565a63",
    700: "#3f434b",
    800: "#2b2e34",
    900: "#191b1f",
  };

  const darkBackground = {
    light: "#1e2126",
    main: "#15171b",
  };

  // mui theme settings
  export const themeSettings = (mode: PaletteMode = "light"): ThemeOptions => {
    const isDark = mode === "dark";
    const grey = isDark ? darkGrey : tokens.grey;
    const background = isDark ? darkBackground : tokens.background;

    // Body/heading text keys, inverted for dark so contrast is preserved.
    const textStrong = isDark ? grey[100] : grey[800];
    const textMuted = isDark ? grey[300] : grey[600];

    return {
    palette: {
      mode,
      primary: {
        ...tokens.primary,
        main: isDark ? tokens.primary[500] : tokens.primary[600],
        light: tokens.primary[500],
      },
      secondary: {
        ...tokens.secondary,
        main: tokens.secondary[500],
      },
      grey: {
        ...grey,
      },
      background: {
        default: background.main,
        paper: background.light,
        light: background.light,
      },
      text: {
        primary: textStrong,
        secondary: textMuted,
      },
      cosmetics: {
        radius: 5,
        colorPrimary: isDark ? grey[700] : tokens.grey[200],
        colorSecondary: isDark ? grey[800] : tokens.grey[100],
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
        color: textStrong,
      },
      h2: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 13,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: textStrong,
      },
      h3: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 13,
        fontWeight: "bold",
        textTransform: "uppercase",
        color: textMuted,
      },
      body1: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: textStrong,
      },
      body2: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: textStrong,
      },
      body3: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: textMuted,
      },
      credit: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: isDark ? tokens.primary[400] : tokens.primary[600],
      },
      debit: {
        fontFamily: ["Reddit Mono", "monospace"].join(","),
        fontSize: 12,
        color: isDark ? "#ff7a5e" : "#E35335",
      },
    },
    };
  };
