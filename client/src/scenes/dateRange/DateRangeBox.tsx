import { Box } from "@mui/material";
import { styled } from "@mui/system";

const DateRangeBox = styled(Box)(({ theme }) => ({
	backgroundColor: theme.palette.background.light,
	borderRadius: theme.palette.cosmetics.radius,
	borderColor: theme.palette.cosmetics.colorPrimary,
	borderWidth: theme.palette.cosmetics.width,
	borderStyle: theme.palette.cosmetics.borderStyle,
	display: 'flex',
	alignItems: "center",
	padding: '5px',
}));

export default DateRangeBox;
