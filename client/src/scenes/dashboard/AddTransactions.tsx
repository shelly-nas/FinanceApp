import React from 'react';
import { Typography, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardBox from '@/components/DashboardBox';
import UploadButton from '@/components/UploadButton';
import { useNavigate } from 'react-router-dom';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';

const AddTransactionsButton: React.FC = () => {
  const { palette } = useTheme();
  const spacing: number = 1.5;
  const navigate = useNavigate();
  const { refetch } = useGetEmptyCategoryTransactionsQuery();

  const handleUploadSuccess = () => {
    refetch();
    navigate('/review-transactions')
  };

  return (
    <DashboardBox sx={{ mb: spacing, position: 'relative' }}>
      <UploadButton onUploadSuccess={handleUploadSuccess} />
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mb: 1 }} />
      <Typography variant="h3">Add Transactions</Typography>
    </DashboardBox>
  );
};

export default AddTransactionsButton;
