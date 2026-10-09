import React from 'react';
import { Box } from '@mui/material';
import Sidebar from '@/scenes/layout/Sidebar';
import ImportDialogs from '@/scenes/layout/ImportDialogs';

/**
 * Sidebar beside the content, without breakpoints: the two flex items wrap,
 * so on a narrow screen the sidebar simply lands above the page.
 */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', bgcolor: 'background.default' }}>
    <Sidebar />
    <Box component="main" sx={{ flex: '999 1 560px', minWidth: 0, p: { xs: 6, md: 8 } }}>
      <Box sx={{ maxWidth: 1600, mx: 'auto' }}>{children}</Box>
    </Box>
    <ImportDialogs />
  </Box>
);

export default AppShell;
