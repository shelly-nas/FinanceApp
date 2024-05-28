import { createTheme } from '@mui/material/styles';
import { themeSettings } from './theme';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { useMemo } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from "@/scenes/header";
import Dashboard from "@/scenes/dashboard";
import DateFilter from '@/scenes/dateFilter';

function App() {
  const theme = useMemo(() => createTheme(themeSettings), []);
  
  return (
    <div className='app'>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              padding: '1rem 2rem 4rem 2rem',
            }}
          >
            <Box maxWidth="1400px" width="100%">
              <Header />
              <DateFilter />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/Review Transactions" element={<div>Review Transactions Page</div>} />
                <Route path="/Review Accounts" element={<div>Review Accounts Page</div>} />
              </Routes>
            </Box>
          </Box>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
