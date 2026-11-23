import { Box } from "@mui/material";
import { styled } from "@mui/system";
import { tokensFor } from "@/theme";

/** Card padding in theme spacing units (4px each), for content that bleeds to the card edge. */
export const CARD_PADDING = 4;

/**
 * A card: the one container every panel sits in.
 *
 * Surface, a hairline border, radius 12 and the first elevation in light mode;
 * in dark mode the lighter surface carries the depth and the shadow is none.
 * Padding is CARD_PADDING (16px): slimmer than the template's 24, because
 * this app is dense with figures and the extra air read as empty space.
 */
const DashboardBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  boxShadow: tokensFor(theme.palette.mode).shadow1,
  padding: theme.spacing(CARD_PADDING),
  minWidth: 0,
}));

export default DashboardBox;
