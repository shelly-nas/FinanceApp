import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from '@/scenes/header';
import Dashboard from '@/scenes/dashboard';
import DateRange from '@/scenes/dateRange';
import { createTheme } from '@mui/material/styles';
import { themeSettings } from '@/theme';
import { DateRangeProvider } from '@/scenes/dateRange/DateRangeContext';
import ReviewTransactions from '@/scenes/reviewTransactions';

const App: React.FC = () => {
  const theme = useMemo(() => createTheme(themeSettings), []);

  return (
    <div className='app' style={{ display: 'flex', justifyContent: 'center' }}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <DateRangeProvider>
            <Box maxWidth="1400px" padding="1rem 2rem 4rem 2rem" style={{ width: '100%' }}>
              <Header />
              <DateRange />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/review-transactions" element={<ReviewTransactions />} />
                {/* <Route path="/Review Accounts" element={<div>Review Accounts Page</div>} /> */}
              </Routes>
            </Box>
          </DateRangeProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;
