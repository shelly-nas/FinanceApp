import "@mui/material/styles";
import "@mui/material/Typography";

// FinanceApp's own typography variants: signed amounts, coloured by direction.
declare module "@mui/material/styles" {
  interface TypographyVariants {
    credit: React.CSSProperties;
    debit: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    credit?: React.CSSProperties;
    debit?: React.CSSProperties;
  }
}

// Allow the custom variants to be passed to <Typography variant="..." />
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    credit: true;
    debit: true;
  }
}
