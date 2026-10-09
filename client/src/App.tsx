import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from '@/scenes/layout/AppShell';
import Dashboard from '@/scenes/dashboard';
import { createTheme } from '@mui/material/styles';
import { themeSettings } from '@/theme';
import { ColorModeProvider, useColorMode } from '@/theme/ColorModeContext';
import { DateRangeProvider } from '@/scenes/dateRange/DateRangeContext';
import Transactions from '@/scenes/transactions';
import Tags from '@/scenes/tags';
import Accounts from '@/scenes/accounts';
import Categories from '@/scenes/categories';
import Reports from '@/scenes/reports';

const ThemedApp: React.FC = () => {
  const { resolvedMode } = useColorMode();
  const theme = useMemo(() => createTheme(themeSettings(resolvedMode)), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DateRangeProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            {/* The import flow and older links still point here. */}
            <Route path="/review-transactions" element={<Transactions />} />
            <Route path="/events" element={<Tags />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            {/* <Route path="/Review Accounts" element={<div>Review Accounts Page</div>} /> */}
          </Routes>
        </AppShell>
      </DateRangeProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ColorModeProvider>
        <ThemedApp />
      </ColorModeProvider>
    </BrowserRouter>
  );
};

export default App;
