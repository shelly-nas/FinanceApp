import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import InsightsIcon from '@mui/icons-material/InsightsOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import { Link, useLocation } from 'react-router-dom';
import ThemeModeToggle from '@/components/ThemeModeToggle';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';
import { tokensFor } from '@/theme';

const NAV = [
  { label: 'Dashboard', path: '/', icon: <SpaceDashboardIcon /> },
  { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon /> },
  { label: 'Reports', path: '/reports', icon: <InsightsIcon /> },
  { label: 'Events', path: '/events', icon: <EventIcon /> },
  { label: 'Accounts', path: '/accounts', icon: <AccountBalanceIcon /> },
  { label: 'Categories', path: '/categories', icon: <CategoryIcon /> },
];

const isActive = (path: string, pathname: string) =>
  path === '/'
    ? pathname === '/'
    // The import flow lands on /review-transactions, which is the same screen.
    : pathname.startsWith(path) || (path === '/transactions' && pathname.startsWith('/review-transactions'));

/**
 * The app's places, in the template's sidebar: name at the top, navigation in
 * the middle, the theme switch at the bottom. Actions live in each page's
 * header instead, so nothing here reads as a destination that is not one.
 */
const Sidebar: React.FC = () => {
  const { palette } = useTheme();
  const t = tokensFor(palette.mode);
  const { pathname } = useLocation();

  // The count of rows still needing a category: the work waiting on that page.
  const { data: needsReview } = useGetEmptyCategoryTransactionsQuery();
  const reviewCount = needsReview?.length ?? 0;

  return (
    // The outer box runs the full height of the page for the surface and the
    // rule; the inner one stays pinned while the content scrolls.
    <Box
      sx={{
        flex: '1 1 248px',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderBottom: { xs: 1, md: 0 },
        borderColor: 'divider',
      }}
    >
      <Box
        component="nav"
        aria-label="Main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          px: 4,
          py: 6,
          position: { md: 'sticky' },
          top: 0,
          height: { md: '100vh' },
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: t.primarySoft,
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <SavingsIcon aria-hidden sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary', lineHeight: 1.25 }}>
              Finance
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.3 }}>Personal overview</Typography>
          </Box>
        </Box>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
          {/* Items keep their 40px; only the list grows, pushing the theme switch down. */}
          {NAV.map((item) => {
            const active = isActive(item.path, pathname);
            const showCount = item.path === '/transactions' && reviewCount > 0;

            return (
              <ListItemButton
                key={item.path}
                component={Link}
                // With rows awaiting a category, the item opens on that filter -
                // which is what the counter is counting.
                to={showCount ? '/transactions?review=true' : item.path}
                selected={active}
                aria-current={active ? 'page' : undefined}
                sx={{ flexGrow: 0 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: 'inherit', '& svg': { fontSize: 20 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 'inherit' }}
                />
                {showCount && (
                  <Box
                    component="span"
                    aria-label={`${reviewCount} need a category`}
                    sx={{
                      minWidth: 22,
                      height: 22,
                      px: 1.5,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      bgcolor: active ? t.primarySoft2 : t.surface3,
                      color: active ? 'primary.main' : t.textBody,
                    }}
                  >
                    {reviewCount}
                  </Box>
                )}
              </ListItemButton>
            );
          })}
        </List>

        <ThemeModeToggle />
      </Box>
    </Box>
  );
};

export default Sidebar;
