// src/components/UploadButton.tsx
import React, { useState } from 'react';
import {
  Button, CircularProgress, Modal, Typography, Select, MenuItem, FormControl, InputLabel,
  Divider, Box
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import DashboardBox from '@/components/DashboardBox';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useGetEmptyCategoryTransactionsQuery, usePostUploadTransactionsMutation } from '@/api';

const ReviewButton: React.FC = () => {
  const { palette } = useTheme();
  const spacing: number = 1.5;
  const navigate = useNavigate();
  const { data: results, error, isLoading, refetch } = useGetEmptyCategoryTransactionsQuery();

  const handleClick = () => {
    refetch();
    navigate('/review-transactions');
  };

  return (
    <DashboardBox sx={{ mb: spacing, position: 'relative' }}>
      <Button
        sx={{
          width: '100%',
          color: palette.secondary[500],
          '&:hover': {
            backgroundColor: palette.action.hover
          }
        }}
        onClick={handleClick}
      >
        <ReceiptLongIcon sx={{ fontSize: 40, color: palette.secondary[400] }} />
      </Button>
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mb: 1 }} />
      <Typography variant="h3">Review Transactions</Typography>
    </DashboardBox>
  );
};

export default ReviewButton;
