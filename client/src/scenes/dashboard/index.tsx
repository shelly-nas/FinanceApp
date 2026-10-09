import React, { useState } from "react";
import { Stack } from "@mui/material";
import KeyFigures from "@/scenes/dashboard/KeyFigures";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import DateRange from '@/scenes/dateRange';
import { useDateRange } from "@/scenes/dateRange/DateRangeContext";
import PageHeader from "@/components/PageHeader";
import ImportActions from "@/scenes/layout/ImportActions";

const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { firstDay } = useDateRange();
  const month = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

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
      <Stack spacing={6} useFlexGap>
        <KeyFigures />
        <SpendingBreakdown onCategorySelect={handleCategorySelect} />
        <TransactionDetails selectedCategory={selectedCategory} />
      </Stack>
    </>
  );
};

export default Dashboard;
