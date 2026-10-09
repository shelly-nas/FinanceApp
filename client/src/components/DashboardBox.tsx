import { Box } from "@mui/material";
import { styled } from "@mui/system";
import { tokensFor } from "@/theme";

/**
 * A card: the one container every panel sits in.
 *
 * Surface, a hairline border, radius 12 and the first elevation in light mode;
 * in dark mode the lighter surface carries the depth and the shadow is none.
 * Padding is 24, the template's card padding.
 */
const DashboardBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  boxShadow: tokensFor(theme.palette.mode).shadow1,
  padding: 24,
  minWidth: 0,
}));

export default DashboardBox;
