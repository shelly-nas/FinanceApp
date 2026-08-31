import React from 'react';
import { Typography, Divider, Box, List, ListItem, ListItemText, Collapse, useTheme, ListItemButton, Button } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import DashboardBox from '@/components/DashboardBox';
import { useGetAccountOverviewQuery } from '@/api';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface AccountCategory {
  account_type: string;
  account_name: string;
  current_balance: string;
}

const groupByAccountType = (accounts: AccountCategory[]) => {
  return accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, AccountCategory[]>);
};

const AccountsOverview: React.FC = () => {
  const { palette, typography } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState(false); // State to toggle visibility
  
  const visibilityStyle = visible ? "" : "blur-text";

  const { data: results } = useGetAccountOverviewQuery();
  const categories = results as unknown[] as AccountCategory[] || [];
  const groupedCategories = groupByAccountType(categories);

  const handleToggle = (category: string) => {
    setOpen((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const calculateNetWorth = () => {
    return categories.reduce((total, category) => total + parseFloat(category.current_balance), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  return (
    <DashboardBox sx={{ mb: 1.5 }}>
      <Box sx={{         
        display: 'flex',
        alignItems: 'center',
        position: 'relative',             
      }}>
        <Box sx={{
          textAlign: 'center',
          width: '100%',
        }}>
          <Typography variant="h3">
            Account Overview
          </Typography>
        </Box>
        <Button sx={{ 
          m: 0.1, 
          p: 0.1, 
          minWidth: 0, 
          position: 'absolute', 
          right: 0, // Align to the right inside the relative parent
          top: '50%', // Center vertically with respect to the parent box
          transform: 'translateY(-50%)', // Adjust the button's center to the middle
          '&:hover': {
            backgroundColor: palette.action.hover, // Hover background color, change as needed
          },
        }} 
        onClick={() => setVisible(!visible)}
        >
          {visible 
            ? <VisibilityOffIcon sx={{ color: typography.h3.color, fontSize: 18 }} />
            : <VisibilityIcon sx={{ color: typography.h3.color, fontSize: 18 }} />}
        </Button>
      </Box>
      
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />
      <List sx={{ ml: -1.5 }}>
        {Object.keys(groupedCategories).map((categoryType) => (
          <div key={categoryType}>
            <ListItemButton onClick={() => handleToggle(categoryType)} sx={{ py: 0.5 }}>
              {open[categoryType] ? <ExpandLess /> : <ExpandMore />}
              <ListItemText
                primary={`${categoryType} (${groupedCategories[categoryType].length})`}
                primaryTypographyProps={{ variant: 'body2' }}
              />
              <Typography variant="body2" className={visibilityStyle}>
                {formatCurrency(groupedCategories[categoryType].reduce((sum, item) => sum + parseFloat(item.current_balance), 0))}
              </Typography>
            </ListItemButton>
            <Collapse in={open[categoryType]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {groupedCategories[categoryType].map((item) => (
                  <ListItem key={item.account_name} sx={{ pl: 3, py: 0 }}>
                    <ListItemText
                      primary={"└ " + item.account_name}
                      primaryTypographyProps={{ variant: 'body3' }}
                    />
                    <Typography variant="body3" className={visibilityStyle} >{formatCurrency(parseFloat(item.current_balance))}</Typography>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </div>
        ))}
      </List>
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mr: 2, ml: 1, mt: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          Estd. Net Worth
        </Typography>
        <Typography variant="body1" className={visibilityStyle} fontWeight="bold">
          {formatCurrency(calculateNetWorth())}
        </Typography>
      </Box>
    </DashboardBox>
  );
};

export default AccountsOverview;
