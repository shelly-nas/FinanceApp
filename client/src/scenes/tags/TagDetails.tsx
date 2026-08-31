import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider,
} from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import { useGetTagSummaryQuery } from '@/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  return new Date(Number(year), Number(m) - 1, 1)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Breakdown for a single event: what it cost in total, where the money went,
 * and how it spread across months - the view a monthly report cannot give.
 */
const TagDetails: React.FC<{ tagId: number }> = ({ tagId }) => {
  const { data: summary } = useGetTagSummaryQuery(tagId);

  if (!summary) return null;

  const netSpent = Number(summary.total_spent) - Number(summary.total_received);
  const budget = summary.budget ? Number(summary.budget) : null;
  const monthMax = Math.max(
    ...summary.by_month.map((m) => Math.abs(Number(m.total_amount))),
    1,
  );

  return (
    <DashboardBox sx={{ p: 1.5 }}>
      <Typography variant="h3" gutterBottom>{summary.tag_name}</Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1.5 }}>
        <Stat label="Total spent" value={formatCurrency(netSpent)} />
        {budget !== null && (
          <>
            <Stat label="Budget" value={formatCurrency(budget)} />
            <Stat
              label={netSpent > budget ? 'Over budget' : 'Left'}
              value={formatCurrency(Math.abs(budget - netSpent))}
            />
          </>
        )}
        <Stat label="Transactions" value={String(summary.transaction_count)} />
        {summary.first_transaction && summary.last_transaction && (
          <Stat
            label="Period"
            value={`${formatMonth(summary.first_transaction.slice(0, 7))} - ${formatMonth(
              summary.last_transaction.slice(0, 7),
            )}`}
          />
        )}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 260px' }}>
          <Typography variant="h3" gutterBottom>By category</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.by_category.map((row) => (
                <TableRow key={row.category ?? 'uncategorised'}>
                  <TableCell>{row.category ?? 'Uncategorised'}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(Number(row.total_amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ flex: '1 1 260px' }}>
          <Typography variant="h3" gutterBottom>Across months</Typography>
          {summary.by_month.map((row) => {
            const amount = Number(row.total_amount);
            return (
              <Box key={row.month} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body3" sx={{ minWidth: 72 }}>
                  {formatMonth(row.month)}
                </Typography>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    flexGrow: 0,
                    width: `${(Math.abs(amount) / monthMax) * 100}%`,
                    minWidth: 2,
                    backgroundColor: summary.color ?? 'primary.main',
                  }}
                />
                <Typography variant="body3">{formatCurrency(amount)}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </DashboardBox>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Typography variant="body3">{label}</Typography>
    <Typography variant="h2">{value}</Typography>
  </Box>
);

export default TagDetails;
