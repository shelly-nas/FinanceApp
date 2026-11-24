import { useGetAccountOverviewQuery } from '@/api';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { describeSelection } from '@/scenes/insights/filter';

/**
 * The page subtitle of Overview and Trends: the selection in words, so the
 * figures say what they cover without a filter row above them.
 */
export const useSelectionLabel = (which: 'period' | 'trend') => {
  const { period, trend, filter } = useInsightsFilter();
  const { data: accounts = [] } = useGetAccountOverviewQuery();
  const label = which === 'trend' ? `${trend.label}, per month` : period.label;
  return describeSelection(label, { selected: filter.accounts.length, total: accounts.length }, filter.categories);
};
