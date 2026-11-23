import type { OneSidedTransfer, TransferCandidate } from '@/api';

/**
 * - recognised: already counted as a transfer, because the counterparty is one
 *   of the user's own accounts. Can be put back.
 * - certain / likely: a debit and a credit of the same amount on two of the
 *   user's accounts, waiting to be confirmed. Certain when both account
 *   numbers match, likely when only amount and date do.
 */
export type TransferStatus = 'recognised' | 'certain' | 'likely';

export interface TransferReviewRow {
  key: string;
  date: string;
  description: string;
  from: string;
  to: string;
  amount: number;
  status: TransferStatus;
  oneSided?: OneSidedTransfer;
  candidate?: TransferCandidate;
}

const label = (name: string | null, details: string | null) => name ?? details ?? 'Unknown account';

/**
 * Both kinds of transfer in one list, newest first, so every movement between
 * the user's own accounts is reviewed in one place. A pair whose sides are both
 * recognised already is not suggested by the server, so nothing appears twice.
 */
export function buildTransferReviewRows(
  oneSided: OneSidedTransfer[],
  candidates: TransferCandidate[],
): TransferReviewRow[] {
  const recognised = oneSided.map<TransferReviewRow>((t) => {
    const own = label(t.account_name, t.account);
    const other = label(t.counterparty_name, t.counterparty);
    const outgoing = t.debit_credit === 'Debit';
    return {
      key: `one-${t.id}`,
      date: t.date_str?.slice(0, 10) ?? '',
      description: t.name_description ?? '—',
      from: outgoing ? own : other,
      to: outgoing ? other : own,
      amount: Number(t.amount),
      status: 'recognised',
      oneSided: t,
    };
  });

  const suggested = candidates.map<TransferReviewRow>((c) => ({
    key: `pair-${c.from_transaction_id}-${c.to_transaction_id}`,
    date: c.from_date?.slice(0, 10) ?? '',
    description: `${c.from_description ?? '—'} → ${c.to_description ?? '—'}`,
    from: label(c.from_account_name, c.from_account),
    to: label(c.to_account_name, c.to_account),
    amount: Number(c.amount),
    status: c.match_basis === 'iban' ? 'certain' : 'likely',
    candidate: c,
  }));

  return [...recognised, ...suggested].sort((a, b) => b.date.localeCompare(a.date));
}
