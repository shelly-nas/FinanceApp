import React, { useState } from "react";
import { Stack } from "@mui/material";
import KeyFigures from "@/scenes/dashboard/KeyFigures";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import AccountFilter from "@/scenes/dashboard/AccountFilter";
import PeriodStepper from "@/scenes/insights/PeriodStepper";
import { useInsightsFilter } from "@/scenes/insights/InsightsFilterContext";
import PageHeader from "@/components/PageHeader";
import ImportActions from "@/scenes/layout/ImportActions";
import { useGetAccountOverviewQuery } from "@/api";

const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { period, filter, update } = useInsightsFilter();
  const { data: allAccounts } = useGetAccountOverviewQuery();

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Balances, income and spending for ${period.label}`}
        actions={
          <>
            <PeriodStepper />
            <ImportActions withInvestments />
          </>
        }
      />
      <Stack spacing={4} useFlexGap>
        <AccountFilter
          accounts={allAccounts ?? []}
          selected={filter.accounts}
          onChange={(accounts) => update({ accounts })}
        />
        <KeyFigures />
        <SpendingBreakdown onCategorySelect={handleCategorySelect} />
        <TransactionDetails selectedCategory={selectedCategory} />
      </Stack>
    </>
  );
};

export default Dashboard;
