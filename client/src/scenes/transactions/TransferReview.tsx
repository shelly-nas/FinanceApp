import React from 'react';
import {
  TableBody, TableCell, TableHead, TableRow, Box, Button, Chip, Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import CardTable from '@/components/CardTable';
import {
  useGetOneSidedTransfersQuery,
  useGetTransferCandidatesQuery,
  useConfirmTransferMutation,
  useRejectTransferMutation,
  useUnmarkInternalMutation,
} from '@/api';
import { buildTransferReviewRows, TransferReviewRow } from '@/scenes/transactions/transferReview';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

interface Props {
  /** JSON array of the ids just imported, to scope the review to that import. */
  transactionIds?: string | null;
}

const STATUS = {
  recognised: {
    label: 'Recognised',
    tooltip: 'The other account is one of yours, so this already counts as a transfer. Put it back if it was a real payment.',
  },
  certain: {
    label: 'Certain',
    tooltip: 'A payment and a deposit of the same amount between two of your accounts, both account numbers known.',
  },
  likely: {
    label: 'Likely',
    tooltip: 'Matched on amount and date only - check before confirming.',
  },
} as const;

/**
 * Every movement between the user's own accounts that needs a look, in one
 * table: those already counted as a transfer on their counterparty, and pairs
 * that look like one, waiting for a decision. Either way it ends up under
 * Overboekingen and out of income and spending.
 *
 * Recognised movements are applied rather than proposed - the counterparty is
 * literally one of the user's accounts - and are listed so a wrong one can be
 * put back. Pairs are proposed only: two unrelated payments of the same amount
 * on the same day look exactly like a transfer.
 */
const TransferReview: React.FC<Props> = ({ transactionIds }) => {
  const scope = transactionIds ? { ids: transactionIds } : {};
  const { data: oneSided } = useGetOneSidedTransfersQuery(scope);
  const { data: candidates } = useGetTransferCandidatesQuery(scope);
  const [confirmTransfer] = useConfirmTransferMutation();
  const [rejectTransfer] = useRejectTransferMutation();
  const [unmarkInternal] = useUnmarkInternalMutation();

  const rows = buildTransferReviewRows(oneSided ?? [], candidates ?? []);
  if (rows.length === 0) return null;

  const toConfirm = rows.filter((r) => r.status !== 'recognised').length;

  const actions = (row: TransferReviewRow) => {
    if (row.oneSided) {
      const { id } = row.oneSided;
      return (
        <Button size="small" variant="text" onClick={() => unmarkInternal(id)}>Not a transfer</Button>
      );
    }
    const pair = {
      fromTransactionId: row.candidate!.from_transaction_id,
      toTransactionId: row.candidate!.to_transaction_id,
    };
    return (
      <>
        <Button size="small" variant="text" onClick={() => rejectTransfer(pair)} sx={{ mr: 2 }}>
          Not a transfer
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => confirmTransfer({ ...pair, matchBasis: row.candidate!.match_basis })}
        >
          Confirm
        </Button>
      </>
    );
  };

  return (
    <DashboardBox>
      <WidgetHeader
        title="Transfers between your own accounts"
        subtitle="Money moved between your accounts, filed under Overboekingen and kept out of income and spending. Confirm the suggested pairs; put back anything that was a real payment."
        action={
          <>
            {toConfirm > 0 && <Chip size="small" color="primary" label={`${toConfirm} to confirm`} />}
            <Chip size="small" label={`${rows.length} total`} />
          </>
        }
      />

      <CardTable dense>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} hover>
              <TableCell sx={{ color: 'text.primary' }}>{row.date}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.from}</TableCell>
              <TableCell>{row.to}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
                {formatCurrency(row.amount)}
              </TableCell>
              <TableCell>
                <Tooltip title={STATUS[row.status].tooltip}>
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={row.status === 'recognised' ? <SwapHorizIcon /> : row.status === 'certain' ? <CheckIcon /> : undefined}
                    label={STATUS[row.status].label}
                    color={row.status === 'certain' ? 'success' : row.status === 'likely' ? 'warning' : 'default'}
                  />
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ whiteSpace: 'nowrap' }}>{actions(row)}</Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </CardTable>
    </DashboardBox>
  );
};

export default TransferReview;
