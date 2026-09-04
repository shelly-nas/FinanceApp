import { useState } from 'react';
import { Typography, useTheme, Tabs, Tab, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Badge } from '@mui/material';
import FlexBetween from '@/components/FlexBetween';
import SavingsIcon from '@mui/icons-material/Savings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeModeToggle from '@/components/ThemeModeToggle';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';

// The tabs are the app's places; the menu holds the actions. Keeping actions out
// of the tab strip is what stops "Review transactions" from reading as a
// destination when it is really a filter, and stops the upload buttons from
// looking like dashboard panels.
const TABS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Events', path: '/events' },
  { label: 'Accounts', path: '/accounts' },
];

type Props = {};

const Header = (_props: Props) => {
  const { palette } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // The count of rows still needing a category: more informative on the tab than
  // a button that cannot say whether there is anything to do.
  const { data: needsReview } = useGetEmptyCategoryTransactionsQuery();
  const reviewCount = needsReview?.length ?? 0;

  const activeTab = TABS.findIndex((tab) =>
    tab.path === '/'
      ? pathname === '/'
      // The import flow lands on /review-transactions, which is the same screen.
      : pathname.startsWith(tab.path) ||
        (tab.path === '/transactions' && pathname.startsWith('/review-transactions')),
  );

  const closeMenu = () => setMenuAnchor(null);

  const go = (path: string) => {
    closeMenu();
    navigate(path);
  };

  return (
    <>
      <FlexBetween mb="0.25rem" p="0.5rem 0rem">
        {/* LEFT SIDE */}
        <FlexBetween gap="0.75rem">
          <SavingsIcon sx={{ color: palette.primary.main, fontSize: 44 }} />
          <Typography variant="h1">Finance Overview</Typography>
        </FlexBetween>

        {/* RIGHT SIDE */}
        <FlexBetween gap="0.5rem">
          <ThemeModeToggle />
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Actions"
            aria-haspopup="true"
          >
            <MoreVertIcon />
          </IconButton>
        </FlexBetween>
      </FlexBetween>

      <Tabs
        value={activeTab === -1 ? false : activeTab}
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.path}
            component={Link}
            // With rows awaiting a category, the tab opens on that filter -
            // which is what the badge is counting.
            to={
              tab.path === '/transactions' && reviewCount > 0
                ? '/transactions?review=true'
                : tab.path
            }
            sx={{ minHeight: 40, textTransform: 'none' }}
            label={
              tab.path === '/transactions' && reviewCount > 0 ? (
                <Badge badgeContent={reviewCount} color="secondary" sx={{ pr: 1.5 }}>
                  {tab.label}
                </Badge>
              ) : (
                tab.label
              )
            }
          />
        ))}
      </Tabs>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => go('/?import=transactions')}>
          <ListItemIcon><CloudUploadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Import transactions</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go('/?import=investments')}>
          <ListItemIcon><LineAxisIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Update investments</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go('/accounts')}>
          <ListItemIcon><AccountBalanceIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Manage accounts</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Header;
