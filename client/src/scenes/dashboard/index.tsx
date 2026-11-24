import React, { useState } from "react";
import { Stack } from "@mui/material";
import KeyFigures from "@/scenes/dashboard/KeyFigures";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import MobileFilters from "@/scenes/insights/MobileFilters";
import { useSelectionLabel } from "@/scenes/insights/useSelectionLabel";
import PageHeader from "@/components/PageHeader";

/**
 * Overview: what the selected period, accounts and categories add up to.
 * The selection is set in the filter panel; the subtitle says what it is.
 */
const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const subtitle = useSelectionLabel('period');

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <>
      <PageHeader title="Overview" subtitle={subtitle} actions={<MobileFilters />} />
      <Stack spacing={4} useFlexGap>
        <KeyFigures />
        <SpendingBreakdown onCategorySelect={handleCategorySelect} />
        <TransactionDetails selectedCategory={selectedCategory} />
      </Stack>
    </>
  );
};

export default Dashboard;
