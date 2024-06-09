import React from 'react';
import { Typography, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardBox from '@/components/DashboardBox';
import UploadInvestButton from '@/components/UploadInvestButton';
import { useNavigate } from 'react-router-dom';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';

const AddInvestmentsButton: React.FC = () => {
  const { palette } = useTheme();
  const spacing: number = 1.5;
  const navigate = useNavigate();
  const { data: results, error, isLoading, refetch } = useGetEmptyCategoryTransactionsQuery();

  return (
    <DashboardBox sx={{ mb: spacing, position: 'relative' }}>
      <UploadInvestButton />
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mb: 1 }} />
      <Typography variant="h3">Add Investments</Typography>
    </DashboardBox>
  );
};

export default AddInvestmentsButton;
