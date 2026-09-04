import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from '@/scenes/header';
import NetWorthBanner from '@/components/NetWorthBanner';
import Dashboard from '@/scenes/dashboard';
import { createTheme } from '@mui/material/styles';
import { themeSettings } from '@/theme';
import { ColorModeProvider, useColorMode } from '@/theme/ColorModeContext';
import { DateRangeProvider } from '@/scenes/dateRange/DateRangeContext';
import Transactions from '@/scenes/transactions';
import Tags from '@/scenes/tags';
import Accounts from '@/scenes/accounts';

const ThemedApp: React.FC = () => {
  const { resolvedMode } = useColorMode();
  const theme = useMemo(() => createTheme(themeSettings(resolvedMode)), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DateRangeProvider>
        <Box maxWidth="1700px" padding="1rem 2rem 4rem 2rem" style={{ width: '100%' }}>
          <Header />
          {/* Always today's figures, on every tab and whatever month a page is
              filtered to - the fixed reference the rest is read against. */}
          <NetWorthBanner />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            {/* The import flow and older links still point here. */}
            <Route path="/review-transactions" element={<Transactions />} />
            <Route path="/events" element={<Tags />} />
            <Route path="/accounts" element={<Accounts />} />
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
