import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Button, Chip, Tooltip, useTheme,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DashboardBox from '@/components/DashboardBox';
import {
  TransferCandidate,
  useGetTransferCandidatesQuery,
  useConfirmTransferMutation,
  useRejectTransferMutation,
} from '@/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (value: string) => value?.slice(0, 10) ?? '';

interface Props {
  /** JSON array of the ids just imported, so suggestions stay scoped to them. */
  transactionIds?: string | null;
}

/**
 * Proposed transfers between the user's own accounts.
 *
 * Moving money from one account to another shows up twice - once as a payment,
 * once as a deposit - and counted naively it inflates both income and expenses
 * for that month. Confirming a pair marks both sides internal so they drop out
 * of the summaries, and files them under the transfer category, which is also
 * what takes them off this screen's list of rows still needing one.
 *
 * Nothing is applied automatically: two unrelated payments of the same amount on
 * the same day are indistinguishable from a transfer, so the user decides.
 */
const TransferSuggestions: React.FC<Props> = ({ transactionIds }) => {
  const { palette } = useTheme();
  const { data: candidates } = useGetTransferCandidatesQuery(
    transactionIds ? { ids: transactionIds } : {},
  );
  const [confirmTransfer] = useConfirmTransferMutation();
  const [rejectTransfer] = useRejectTransferMutation();

  if (!candidates || candidates.length === 0) return null;

  const accountLabel = (name: string | null, details: string | null) =>
    name ?? details ?? 'Unknown account';

  const handleConfirm = (c: TransferCandidate) =>
    confirmTransfer({
      fromTransactionId: c.from_transaction_id,
      toTransactionId: c.to_transaction_id,
      matchBasis: c.match_basis,
    });

  const handleReject = (c: TransferCandidate) =>
    rejectTransfer({
      fromTransactionId: c.from_transaction_id,
      toTransactionId: c.to_transaction_id,
    });

  return (
    <DashboardBox sx={{ mb: 1.5, p: 1.5, textAlign: 'left' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <SwapHorizIcon sx={{ color: palette.secondary[400] }} />
        <Typography variant="h3" sx={{ flexGrow: 1 }}>
          Transfers between your own accounts
        </Typography>
        <Chip size="small" label={`${candidates.length} found`} />
      </Box>
      <Typography variant="body3" sx={{ display: 'block', mb: 1 }}>
        These pairs look like one movement counted twice. Confirming keeps them out
        of your income and expenses and files them under Overboekingen.
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Match</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={`${c.from_transaction_id}-${c.to_transaction_id}`} hover>
              <TableCell>
                <Typography variant="body2">
                  {accountLabel(c.from_account_name, c.from_account)}
                </Typography>
                <Typography variant="body3">
                  {formatDate(c.from_date)} · {c.from_description ?? '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {accountLabel(c.to_account_name, c.to_account)}
                </Typography>
                <Typography variant="body3">
                  {formatDate(c.to_date)} · {c.to_description ?? '—'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(Number(c.amount))}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip
                  title={
                    c.match_basis === 'iban'
                      ? 'Both accounts are known, so this is certainly a transfer'
                      : 'Matched on amount and date only - check before confirming'
                  }
                >
                  <Chip
                    size="small"
                    label={c.match_basis === 'iban' ? 'Certain' : 'Likely'}
                    color={c.match_basis === 'iban' ? 'success' : 'default'}
                    variant={c.match_basis === 'iban' ? 'filled' : 'outlined'}
                  />
                </Tooltip>
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                <Button size="small" onClick={() => handleConfirm(c)}>
                  Confirm
                </Button>
                <Button size="small" color="inherit" onClick={() => handleReject(c)}>
                  Not a transfer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardBox>
  );
};

export default TransferSuggestions;
