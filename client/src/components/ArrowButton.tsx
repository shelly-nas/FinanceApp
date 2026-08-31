import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const ArrowButton = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
  cursor: "pointer",
  justifyContent: "center",
	color: theme.typography.h2.color,
}));

export default ArrowButton;
