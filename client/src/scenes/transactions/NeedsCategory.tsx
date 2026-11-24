import React from 'react';
import { Chip } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import TransactionTable from '@/components/TransactionTable';
import { TransactionRow, useSearchTransactionsQuery } from '@/api';

interface Props {
  categories: string[];
  onEdit: (row: TransactionRow, column: keyof TransactionRow, value: string) => void;
  savingIds: number[];
}

/**
 * Transactions the classifier was not sure about, newest first. Picking a
 * category takes a row off the list; the rest of the row can be edited here
 * too, so nothing needs a trip to All.
 */
const NeedsCategory: React.FC<Props> = ({ categories, onEdit, savingIds }) => {
  const { data } = useSearchTransactionsQuery({
    uncategorised: true,
    includeInternal: true,
    sortBy: 'date_str',
    sortDir: 'desc',
    limit: 100,
  });
  const rows = data?.rows ?? [];
  if (rows.length === 0) return null;

  return (
    <DashboardBox>
      <WidgetHeader
        title="Needs a category"
        subtitle="The classifier was not sure. Click the category cell to pick one."
        action={<Chip size="small" color="warning" variant="outlined" label={data?.total ?? rows.length} />}
      />
      <TransactionTable rows={rows} editable categories={categories} onEdit={onEdit} savingIds={savingIds} />
    </DashboardBox>
  );
};

export default NeedsCategory;
