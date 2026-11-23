import React, { useEffect, useMemo, useState } from "react";
import { Stack } from "@mui/material";
import KeyFigures from "@/scenes/dashboard/KeyFigures";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import AccountFilter from "@/scenes/dashboard/AccountFilter";
import { STORAGE_KEY, effectiveSelection, parseStoredSelection } from "@/scenes/dashboard/accountSelection";
import DateRange from '@/scenes/dateRange';
import { useDateRange } from "@/scenes/dateRange/DateRangeContext";
import PageHeader from "@/components/PageHeader";
import ImportActions from "@/scenes/layout/ImportActions";
import { useGetAccountOverviewQuery } from "@/api";

const readStored = () => {
  try {
    return parseStoredSelection(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
};

const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { firstDay } = useDateRange();
  const month = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // The accounts the dashboard covers, remembered between visits.
  const { data: allAccounts } = useGetAccountOverviewQuery();
  const [storedSelection, setStoredSelection] = useState<string[]>(readStored);
  const selectedAccounts = useMemo(
    () => (allAccounts ? effectiveSelection(storedSelection, allAccounts) : []),
    [storedSelection, allAccounts],
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSelection));
    } catch {
      // Private mode or full storage: the selection just is not remembered.
    }
  }, [storedSelection]);

  // Undefined rather than an empty list, so "all accounts" shares its cache
  // entries with the requests made before this filter existed.
  const accounts = selectedAccounts.length > 0 ? selectedAccounts : undefined;

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Balances, income and spending for ${month}`}
        actions={
          <>
            <DateRange />
            <ImportActions withInvestments />
          </>
        }
      />
      <Stack spacing={4} useFlexGap>
        <AccountFilter
          accounts={allAccounts ?? []}
          selected={selectedAccounts}
          onChange={setStoredSelection}
        />
        <KeyFigures accounts={accounts} />
        <SpendingBreakdown onCategorySelect={handleCategorySelect} accounts={accounts} />
        <TransactionDetails selectedCategory={selectedCategory} accounts={accounts} />
      </Stack>
    </>
  );
};

export default Dashboard;
