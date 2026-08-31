import { Typography, useTheme, Button } from "@mui/material"
import FlexBetween from "@/components/FlexBetween"
import SavingsIcon from '@mui/icons-material/Savings';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Link, useLocation } from 'react-router-dom';
import ThemeModeToggle from "@/components/ThemeModeToggle";

type Props = {};

const Header = (_props: Props) => {
  const{ palette } = useTheme();
  const { pathname } = useLocation();

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
      <FlexBetween gap="0.75rem">
        <Button
          component={Link}
          to={pathname === '/events' ? '/' : '/events'}
          startIcon={<LocalOfferIcon />}
          sx={{ color: palette.grey[700] }}
        >
          {pathname === '/events' ? 'Dashboard' : 'Events'}
        </Button>
        <ThemeModeToggle />
      </FlexBetween>
    </FlexBetween>
  )
}

export default Header;
