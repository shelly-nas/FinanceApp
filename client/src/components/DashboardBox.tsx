import { Box } from "@mui/material";
import { styled } from "@mui/system";

const DashboardBox = styled(Box)(({ theme }) => ({
    textAlign: "center",
    padding: 10,
    backgroundColor: theme.palette.background.light,
    borderRadius: theme.palette.cosmetics.radius,
    borderColor: theme.palette.cosmetics.colorPrimary,
    borderWidth: theme.palette.cosmetics.width,
    borderStyle: theme.palette.cosmetics.borderStyle
}));

export default DashboardBox;
