import { useGetEmptyCategoryTransactionsQuery, useGetTransferCandidatesQuery, useGetUnknownAccountsQuery } from '@/api';

/**
 * What an import left to decide: new accounts to add, transfers to confirm and
 * transactions without a category. The menu counter and the To do tab count
 * exactly these.
 */
export const useTodoCount = () => {
  const { data: unknownAccounts } = useGetUnknownAccountsQuery();
  const { data: candidates } = useGetTransferCandidatesQuery({});
  const { data: uncategorised } = useGetEmptyCategoryTransactionsQuery();
  const parts = {
    accounts: unknownAccounts?.length ?? 0,
    transfers: candidates?.length ?? 0,
    uncategorised: uncategorised?.length ?? 0,
  };
  return { ...parts, total: parts.accounts + parts.transfers + parts.uncategorised };
};
