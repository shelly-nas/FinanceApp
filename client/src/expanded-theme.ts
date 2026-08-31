import "@mui/material/styles";
import "@mui/material/Typography";

// Custom palette entry used across the dashboard for borders/spacing tokens.
interface Cosmetics {
  radius: number;
  colorPrimary: string;
  colorSecondary: string;
  width: number;
  borderStyle: string;
  spacing: number;
}

declare module "@mui/material/styles/createPalette" {
  interface PaletteColor {
    [key: number]: string;
  }

  interface Palette {
    cosmetics: Cosmetics;
  }

  interface PaletteOptions {
    cosmetics?: Cosmetics;
  }

  interface TypeBackground {
    light: string;
  }
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    body3: React.CSSProperties;
    credit: React.CSSProperties;
    debit: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
    credit?: React.CSSProperties;
    debit?: React.CSSProperties;
  }
}

// Allow the custom variants to be passed to <Typography variant="..." />
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body3: true;
    credit: true;
    debit: true;
  }
}
