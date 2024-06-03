import React from 'react';
import { Typography, Divider, Box, List, ListItem, ListItemText, Collapse, ListSubheader, useTheme, ListItemButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import DashboardBox from '@/components/DashboardBox';

interface AccountItem {
  name: string;
  balance: number;
}

interface AccountCategory {
  name: string;
  items: AccountItem[];
}

interface AccountsOverviewProps {
  categories: AccountCategory[];
}

const AccountsOverview: React.FC<AccountsOverviewProps> = ({ categories }) => {
  const { palette } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const handleToggle = (category: string) => {
    setOpen((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const calculateNetWorth = () => {
    return categories.reduce((total, category) => {
      return total + category.items.reduce((sum, item) => sum + item.balance, 0);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <DashboardBox sx={{ mb: 1.5 }}>
      <Typography mb={palette.cosmetics.spacing} variant="h3">Account Overview</Typography>
      <Divider color={palette.cosmetics.colorSecondary} sx={{mt: 1, mb:1 }} />
      <List sx={{ml: -1.5}}>
        {categories.map((category) => (
          <div key={category.name}>
            <ListItemButton onClick={() => handleToggle(category.name)} sx={{ py: 0.5 }}>
              {open[category.name] ? <ExpandLess /> : <ExpandMore />}
              <ListItemText 
                primary={`${category.name} (${category.items.length})`} 
                primaryTypographyProps={{ variant: 'body2' }}
              />
              <Typography variant="body2">
                {formatCurrency(category.items.reduce((sum, item) => sum + item.balance, 0))}
              </Typography>
            </ListItemButton>
            <Collapse in={open[category.name]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {category.items.map((item) => (
                  <ListItem key={item.name} sx={{ pl: 3, py: 0 }}>
                    <ListItemText 
                      primary={"└ "+item.name} 
                      primaryTypographyProps={{ variant: 'body3' }}
                    />
                    <Typography variant="body3">{formatCurrency(item.balance)}</Typography>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </div>
        ))}
      </List>
      <Divider color={palette.cosmetics.colorSecondary} sx={{mt: 1, mb:1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mr:2, ml:1, mt:1 }}>
        <Typography variant="body1" fontWeight="bold">
          Estd. Net Worth
        </Typography>
        <Typography variant="credit" fontWeight="bold">
          {formatCurrency(calculateNetWorth())}
        </Typography>
      </Box>
    </DashboardBox>
  );
};

export default AccountsOverview;

// // Layout
// display: 'flex',                    // e.g., 'flex', 'block', 'inline-block'
// flexDirection: 'column',            // e.g., 'row', 'column'
// justifyContent: 'space-between',    // e.g., 'flex-start', 'center', 'space-between'
// alignItems: 'center',               // e.g., 'flex-start', 'center', 'flex-end'
// flexWrap: 'wrap',                   // e.g., 'nowrap', 'wrap', 'wrap-reverse'

// // Sizing
// width: '100%',                      // e.g., '100%', '200px', 'auto'
// height: 'auto',                     // e.g., '100%', '200px', 'auto'
// minWidth: '300px',                  // e.g., '300px', '50%'
// minHeight: '200px',                 // e.g., '200px', '50%'
// maxWidth: '600px',                  // e.g., '600px', '100%'
// maxHeight: '400px',                 // e.g., '400px', '100%'

// // Spacing
// padding: '16px',                    // e.g., '16px', '1rem'
// paddingTop: '1rem',                 // e.g., '1rem', '10px'
// paddingRight: '1rem',               // e.g., '1rem', '10px'
// paddingBottom: '1rem',              // e.g., '1rem', '10px'
// paddingLeft: '1rem',                // e.g., '1rem', '10px'
// margin: '16px',                     // e.g., '16px', '1rem'
// marginTop: '1rem',                  // e.g., '1rem', '10px'
// marginRight: '1rem',                // e.g., '1rem', '10px'
// marginBottom: '1rem',               // e.g., '1rem', '10px'
// marginLeft: '1rem',                 // e.g., '1rem', '10px'
// gap: '16px',                        // e.g., '16px', '1rem'

// // Borders
// border: '1px solid grey',           // e.g., '1px solid grey'
// borderRadius: '8px',                // e.g., '8px', '50%'
// borderTop: '2px solid black',       // e.g., '2px solid black'
// borderRight: '2px solid black',     // e.g., '2px solid black'
// borderBottom: '2px solid black',    // e.g., '2px solid black'
// borderLeft: '2px solid black',      // e.g., '2px solid black'

// // Colors
// backgroundColor: 'background.paper',// e.g., 'primary.main', 'secondary.light'
// color: 'text.primary',              // e.g., 'text.primary', 'text.secondary'

// // Shadows
// boxShadow: 3,                       // e.g., 1, 2, 3, '0px 4px 6px -1px rgba(0,0,0,0.1)'

// // Typography
// fontFamily: 'Roboto, sans-serif',   // e.g., 'Arial, sans-serif'
// fontSize: '16px',                   // e.g., '16px', '1rem'
// fontWeight: 'bold',                 // e.g., 'normal', 'bold'
// lineHeight: '1.5',                  // e.g., '1.5', '2'
// letterSpacing: '0.1em',             // e.g., '0.1em', '1px'

// // Position
// position: 'relative',               // e.g., 'relative', 'absolute', 'fixed'
// top: '10px',                        // e.g., '10px', '1rem'
// right: '10px',                      // e.g., '10px', '1rem'
// bottom: '10px',                     // e.g., '10px', '1rem'
// left: '10px',                       // e.g., '10px', '1rem'
// zIndex: 1,                          // e.g., 1, 10, 100

// // Overflow
// overflow: 'hidden',                 // e.g., 'hidden', 'scroll', 'auto'
// overflowX: 'auto',                  // e.g., 'hidden', 'scroll', 'auto'
// overflowY: 'auto',                  // e.g., 'hidden', 'scroll', 'auto'

// // Transform
// transform: 'rotate(45deg)',         // e.g., 'rotate(45deg)', 'scale(1.5)'
// transformOrigin: 'center',          // e.g., 'center', 'top left'

// // Other
// opacity: 0.8,                       // e.g., 0.5, 0.8, 1
// cursor: 'pointer',                  // e.g., 'pointer', 'default'