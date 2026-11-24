import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import InsightsIcon from '@mui/icons-material/InsightsOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import ImportExportIcon from '@mui/icons-material/ImportExportOutlined';
import { Link, useLocation } from 'react-router-dom';
import ThemeModeToggle from '@/components/ThemeModeToggle';
import FilterPanel from '@/scenes/insights/FilterPanel';
import { useTodoCount } from '@/scenes/transactions/useTodoCount';
import { tokensFor } from '@/theme';

/**
 * Two zones: Insights reads the figures through one filter, Manage keeps the
 * data that feeds them. See docs/ontwerp/navigatie-en-filters.md.
 */
const GROUPS = [
  {
    label: 'Insights',
    items: [
      { label: 'Overview', path: '/', icon: <SpaceDashboardIcon /> },
      { label: 'Trends', path: '/trends', icon: <InsightsIcon /> },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon /> },
      { label: 'Accounts', path: '/accounts', icon: <AccountBalanceIcon /> },
      { label: 'Categories', path: '/categories', icon: <CategoryIcon /> },
      { label: 'Events', path: '/events', icon: <EventIcon /> },
      { label: 'Import & export', path: '/import-export', icon: <ImportExportIcon /> },
    ],
  },
];

const INSIGHTS_PATHS = ['/', '/trends'];

const isActive = (path: string, pathname: string) =>
  path === '/'
    ? pathname === '/'
    // The import flow lands on /review-transactions, which is the same screen.
    : pathname.startsWith(path) || (path === '/transactions' && pathname.startsWith('/review-transactions'));

/** The app's mark and name: heads the sidebar, and the top bar on a phone. */
export const Brand: React.FC = () => {
  const { palette } = useTheme();
  const t = tokensFor(palette.mode);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
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
  );
};

/**
 * The app's places, in the template's sidebar: name at the top, the Insights
 * and Manage groups, and on an Insights page the filter, which scrolls on its
 * own so the navigation stays in view however far it is unfolded. The theme
 * switch sits at the bottom. The shell decides where it goes: beside the
 * content on a desktop, in a drawer on a phone, where `onNavigate` closes the
 * drawer again and the filter lives in a sheet of its own instead.
 */
const Sidebar: React.FC<{ onNavigate?: () => void; showFilters?: boolean }> = ({ onNavigate, showFilters = false }) => {
  const { palette } = useTheme();
  const t = tokensFor(palette.mode);
  const { pathname } = useLocation();
  const todo = useTodoCount();
  const onInsights = INSIGHTS_PATHS.includes(pathname);

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        px: 4,
        py: 5,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ px: 2 }}>
        <Brand />
      </Box>

      {GROUPS.map((group) => (
        <Box key={group.label} sx={{ flexShrink: 0 }}>
          <Typography variant="overline" component="h2" sx={{ display: 'block', px: 2, mb: 1 }}>{group.label}</Typography>
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {group.items.map((item) => {
              const active = isActive(item.path, pathname);
              const showCount = item.path === '/transactions' && todo.total > 0;

              return (
                <ListItemButton
                  key={item.path}
                  component={Link}
                  // With something to decide, the item opens on To do - which
                  // is what the counter is counting.
                  to={showCount ? '/transactions?tab=todo' : item.path}
                  selected={active}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavigate}
                  sx={{ flexGrow: 0, height: 36 }}
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
                      aria-label={`${todo.total} to do`}
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
                      {todo.total}
                    </Box>
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', mx: -1, px: 1 }}>
        {showFilters && onInsights && <FilterPanel />}
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <ThemeModeToggle />
      </Box>
    </Box>
  );
};

export default Sidebar;
