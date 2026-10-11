import React, { useState } from 'react';
import { Box, Drawer, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuRounded';
import Sidebar, { Brand } from '@/scenes/layout/Sidebar';
import ImportDialogs from '@/scenes/layout/ImportDialogs';

const SIDEBAR_WIDTH = 248;
const TOPBAR_HEIGHT = 56;

/**
 * Sidebar beside the content from `md` up, pinned while the page scrolls.
 * Below that a top bar with the name and a menu button, which opens the same
 * sidebar in a drawer - so on a phone the page starts right under the bar
 * instead of under the whole navigation.
 */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {desktop ? (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flex: 'none',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          <Sidebar />
        </Box>
      ) : (
        <>
          <Box
            component="header"
            sx={{
              position: 'fixed',
              insetInline: 0,
              top: 0,
              zIndex: theme.zIndex.appBar,
              height: TOPBAR_HEIGHT,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Tooltip title="Menu">
              <IconButton aria-label="Open menu" onClick={() => setMenuOpen(true)} sx={{ width: 44, height: 44 }}>
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <Brand />
          </Box>
          <Drawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            PaperProps={{ sx: { width: SIDEBAR_WIDTH + 32, maxWidth: '85vw', backgroundImage: 'none' } }}
          >
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </Drawer>
        </>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 4, sm: 6, md: 8 },
          pt: { xs: `${TOPBAR_HEIGHT + 24}px`, md: 8 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Box sx={{ maxWidth: 1600, mx: 'auto' }}>{children}</Box>
      </Box>
      <ImportDialogs />
    </Box>
  );
};

export default AppShell;
