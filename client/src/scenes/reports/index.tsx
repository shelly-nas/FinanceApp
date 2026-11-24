import React from 'react';
import { Chip, Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import PageHeader from '@/components/PageHeader';
import NetWorthChart from '@/scenes/reports/NetWorthChart';
import CategoryTrendChart from '@/scenes/reports/CategoryTrendChart';
import CashflowChart from '@/scenes/reports/CashflowChart';
import MobileFilters from '@/scenes/insights/MobileFilters';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { useSelectionLabel } from '@/scenes/insights/useSelectionLabel';
import { toMonthKey } from '@/utils/monthRange';

/**
 * Trends: how the selection developed, per month.
 *
 * Reads the same filter as Overview, so switching between the two keeps the
 * selection. A single month has nothing to show per month, so the charts then
 * cover the twelve months up to it, and the subtitle says so.
 */
const Reports: React.FC = () => {
  const { filter, toggleCategory, trend } = useInsightsFilter();
  const subtitle = useSelectionLabel('trend');

  // The current month is still running, so its figures are partial. Saying so
  // beats a reader concluding that spending collapsed this month.
  const endsThisMonth = trend.to === toMonthKey(new Date());

  return (
    <>
      <PageHeader
        title="Trends"
        subtitle={trend.widened ? `${subtitle} - the 12 months up to the selected month` : subtitle}
        actions={
          <>
            {endsThisMonth && (
              <Chip variant="outlined" size="small" icon={<InfoIcon />} label="This month is still running" />
            )}
            <MobileFilters />
          </>
        }
      />

      <Stack spacing={4} useFlexGap>
        <NetWorthChart startDate={trend.startDate} endDate={trend.endDate} />
        <CashflowChart startDate={trend.startDate} endDate={trend.endDate} />
        <CategoryTrendChart
          startDate={trend.startDate}
          endDate={trend.endDate}
          selected={filter.categories}
          onToggleCategory={toggleCategory}
        />
      </Stack>
    </>
  );
};

export default Reports;
