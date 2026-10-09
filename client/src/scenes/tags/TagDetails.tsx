import React from 'react';
import {
  Box, Typography, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import CardTable from '@/components/CardTable';
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
    <DashboardBox>
      <WidgetHeader title={summary.tag_name} subtitle="Where the money for this event went" />

      <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap', mb: 8 }}>
        <Stat label="Total spent" value={formatCurrency(netSpent)} />
        {budget !== null && (
          <>
            <Stat label="Budget" value={formatCurrency(budget)} />
            <Stat
              label={netSpent > budget ? 'Over budget' : 'Left'}
              value={formatCurrency(Math.abs(budget - netSpent))}
              tone={netSpent > budget ? 'error' : undefined}
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

      <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Typography variant="overline" component="h3" sx={{ display: 'block', mb: 2 }}>By category</Typography>
          <CardTable>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.by_category.map((row) => (
                <TableRow key={row.category ?? 'uncategorised'} hover>
                  <TableCell>{row.category ?? 'Uncategorised'}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(Number(row.total_amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </CardTable>
        </Box>

        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Typography variant="overline" component="h3" sx={{ display: 'block', mb: 2 }}>Across months</Typography>
          {summary.by_month.map((row) => {
            const amount = Number(row.total_amount);
            return (
              <Box key={row.month} sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 1.5 }}>
                <Typography variant="body2" sx={{ minWidth: 72 }}>
                  {formatMonth(row.month)}
                </Typography>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    flexGrow: 0,
                    width: `${(Math.abs(amount) / monthMax) * 100}%`,
                    minWidth: 2,
                    backgroundColor: summary.color ?? 'primary.main',
                  }}
                />
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {formatCurrency(amount)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </DashboardBox>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: 'error' }> = ({ label, value, tone }) => (
  <Box>
    <Typography variant="overline" component="p">{label}</Typography>
    <Typography
      variant="h3"
      component="p"
      sx={{ mt: 1, fontVariantNumeric: 'tabular-nums', color: tone === 'error' ? 'error.main' : undefined }}
    >
      {value}
    </Typography>
  </Box>
);

export default TagDetails;
