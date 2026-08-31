import React from 'react';
import { Typography, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardBox from '@/components/DashboardBox';
import UploadInvestButton from '@/components/UploadInvestButton';

const AddInvestmentsButton: React.FC = () => {
  const { palette } = useTheme();
  const spacing: number = 1.5;

  return (
    <DashboardBox sx={{ mb: spacing, position: 'relative' }}>
      <UploadInvestButton />
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mb: 1 }} />
      <Typography variant="h3">Add Investments</Typography>
    </DashboardBox>
  );
};

export default AddInvestmentsButton;
