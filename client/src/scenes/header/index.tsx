import { useState} from "react"
import { Box, Typography, useTheme } from "@mui/material"
import FlexBetween from "@/components/FlexBetween"
import SavingsIcon from '@mui/icons-material/Savings';

type Props = {};

const Header = (props: Props) => {
  const{ palette } = useTheme();
  const [selected, setSelected] = useState("Dashboard")
  return(
    <FlexBetween mb="0.25rem" p="0.5rem 0rem">
      {/* LEFT SIDE */}
      <FlexBetween gap="0.75rem">
        <SavingsIcon sx={{ color: palette.primary.main, fontSize: 44}} />
        <Typography variant="h1">
          Finance Overview
        </Typography>
      </FlexBetween>
      {/* RIGHT SIDE */}
      {/* <FlexBetween gap= "2rem">
        <Box sx={{ "&:hover": { color: palette.primary[100]}}}>
          <Link 
            to="/" 
            onClick={() => setSelected("dashboard")} 
            style={{ color: selected === "dashboard" ? "inherit" : palette.grey[700],
              textDecoration: "inherit",
            }}
            >
              Dashboard
          </Link>
        </Box>
        <Box sx={{ "&:hover": { color: palette.primary[100]}}}>
          <Link 
            to="/predictions" 
            onClick={() => setSelected("predictions")} 
            style={{ color: selected === "predictions" ? "inherit" : palette.grey[700],
              textDecoration: "inherit",
            }}
            >
              Predictions
          </Link>
        </Box>
      </FlexBetween> */}
    </FlexBetween>
  )
}

export default Header;
