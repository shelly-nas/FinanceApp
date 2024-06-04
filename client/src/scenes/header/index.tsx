import { Typography, useTheme } from "@mui/material"
import FlexBetween from "@/components/FlexBetween"
import SavingsIcon from '@mui/icons-material/Savings';

type Props = {};

const Header = (props: Props) => {
  const{ palette } = useTheme();

  return(
    <FlexBetween mb="0.25rem" p="0.5rem 0rem">
      {/* LEFT SIDE */}
      <FlexBetween gap="0.75rem">
        <SavingsIcon sx={{ color: palette.primary.main, fontSize: 44}} />
        <Typography variant="h1">
          Finance Overview
        </Typography>
      </FlexBetween>
    </FlexBetween>
  )
}

export default Header;
