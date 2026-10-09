import React from 'react';
import {
  Typography, TableBody, TableCell, TableHead, TableRow,
  Button, Chip, Tooltip,
} from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import CardTable from '@/components/CardTable';
import {
  OneSidedTransfer,
  useGetOneSidedTransfersQuery,
  useUnmarkInternalMutation,
} from '@/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

interface Props {
  /** JSON array of the ids just imported, to scope this to that import. */
  transactionIds?: string | null;
}

/**
 * Movements recognised as internal on their counterparty alone.
 *
 * Unlike the paired suggestions these are applied rather than proposed, because
 * they are not a guess: the counterparty is literally one of the user's own
 * accounts. They are listed anyway so the change is visible, and so a wrong one
 * can be put back - the alternative is a silent reclassification of money the
 * user may well consider spent.
 *
 * This is the only way a deposit into an investment account is recognised at
 * all: those ship no export, so there is never a counterpart to match against,
 * and counted naively the monthly deposit is the largest expense of the month.
 */
const OneSidedTransfers: React.FC<Props> = ({ transactionIds }) => {
  const { data: transfers } = useGetOneSidedTransfersQuery(
    transactionIds ? { ids: transactionIds } : {},
  );
  const [unmarkInternal] = useUnmarkInternalMutation();

  if (!transfers || transfers.length === 0) return null;

  const label = (name: string | null, details: string | null) => name ?? details ?? 'Unknown';

  return (
    <DashboardBox>
      <WidgetHeader
        title="Moved between your own accounts"
        subtitle="The other account is one of yours, so this is money moved rather than spent. It is kept out of your income and expenses, and still counts in the balances. Put one back if it was a real payment."
        action={<Chip size="small" label={`${transfers.length} found`} />}
      />

      <CardTable>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transfers.map((transfer: OneSidedTransfer) => (
            <TableRow key={transfer.id} hover>
              <TableCell>
                <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{transfer.date_str?.slice(0, 10)}</Typography>
                <Typography variant="body2">{transfer.name_description ?? '—'}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {transfer.debit_credit === 'Debit'
                    ? label(transfer.account_name, transfer.account)
                    : label(transfer.counterparty_name, transfer.counterparty)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {transfer.debit_credit === 'Debit'
                    ? label(transfer.counterparty_name, transfer.counterparty)
                    : label(transfer.account_name, transfer.account)}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(Number(transfer.amount))}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Count this as ordinary spending again">
                  <Button size="small" variant="outlined" onClick={() => unmarkInternal(transfer.id)}>
                    Not a transfer
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </CardTable>
    </DashboardBox>
  );
};

export default OneSidedTransfers;
