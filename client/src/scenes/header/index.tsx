import { Box, Button, Typography, useTheme, Tabs, Tab, Badge } from '@mui/material';
import FlexBetween from '@/components/FlexBetween';
import SavingsIcon from '@mui/icons-material/Savings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeModeToggle from '@/components/ThemeModeToggle';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';

// The tabs are the app's places; the buttons beside them are the actions that
// feed those places. Keeping actions out of the tab strip itself is what stops
// "Review transactions" from reading as a destination when it is really a
// filter, and stops the upload buttons from looking like dashboard panels.
const TABS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Reports', path: '/reports' },
  { label: 'Events', path: '/events' },
  { label: 'Accounts', path: '/accounts' },
  { label: 'Categories', path: '/categories' },
];

type Props = {};

const Header = (_props: Props) => {
  const { palette } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

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

  return (
    <>
      <FlexBetween mb="0.25rem" p="0.5rem 0rem">
        {/* LEFT SIDE */}
        <FlexBetween gap="0.75rem">
          <SavingsIcon sx={{ color: palette.primary.main, fontSize: 44 }} />
          <Typography variant="h1">Finance Overview</Typography>
        </FlexBetween>

        {/* RIGHT SIDE */}
        <ThemeModeToggle />
      </FlexBetween>

      {/* The two import actions sit on the tab row rather than above it: both
          submit data to the dashboard, so they belong at the same level as the
          places they feed, not in the title bar. */}
      <FlexBetween
        // Same gap below as the widgets keep between each other (mb: 1.5), so
        // the tab strip sits in the page's rhythm rather than crowding the
        // panel underneath it.
        sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tabs
          value={activeTab === -1 ? false : activeTab}
          sx={{ minHeight: 48 }}
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
              sx={{ minHeight: 48, textTransform: 'none' }}
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

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, pl: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => navigate('/?import=transactions')}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Import transactions
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LineAxisIcon />}
            onClick={() => navigate('/?import=investments')}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Update investments
          </Button>
        </Box>
      </FlexBetween>
    </>
  );
};

export default Header;
