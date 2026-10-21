import { DaysFilter, FilterBar } from '@/src/components/ui';

export function AnalyticsFilters({ days }: { days: number }) {
  return (
    <FilterBar>
      <DaysFilter value={days} options={[7, 14, 30, 90]} />
    </FilterBar>
  );
}
