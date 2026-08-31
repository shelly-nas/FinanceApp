import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from '@/scenes/header';
import Dashboard from '@/scenes/dashboard';
import { createTheme } from '@mui/material/styles';
import { themeSettings } from '@/theme';
import { ColorModeProvider, useColorMode } from '@/theme/ColorModeContext';
import { DateRangeProvider } from '@/scenes/dateRange/DateRangeContext';
import ReviewTransactions from '@/scenes/reviewTransactions';
import Tags from '@/scenes/tags';

const ThemedApp: React.FC = () => {
  const { resolvedMode } = useColorMode();
  const theme = useMemo(() => createTheme(themeSettings(resolvedMode)), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DateRangeProvider>
        <Box maxWidth="1700px" padding="1rem 2rem 4rem 2rem" style={{ width: '100%' }}>
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review-transactions" element={<ReviewTransactions />} />
            <Route path="/events" element={<Tags />} />
            {/* <Route path="/Review Accounts" element={<div>Review Accounts Page</div>} /> */}
          </Routes>
        </Box>
      </DateRangeProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <div className='app' style={{ display: 'flex', justifyContent: 'center' }}>
      <BrowserRouter>
        <ColorModeProvider>
          <ThemedApp />
        </ColorModeProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;
