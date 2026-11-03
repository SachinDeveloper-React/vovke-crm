import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { TrainingView } from '@/src/sections/training/view';

export const metadata = { title: 'Workouts · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Workouts"
        subtitle="The exercise list, and the templates built from it. Both are read live by the app; a finished workout keeps its own copy."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

/**
 * Two lists on one page, so two of every paging parameter.
 *
 * The gym is exercises *and* the templates built out of them, read together
 * because each decides what can be done to the other — and one `?offset=`
 * cannot mean both, so each table names its own.
 */
async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <TrainingView
      query={{
        exerciseQ: readString(params, 'exerciseQ'),
        muscleGroup: readString(params, 'muscleGroup'),
        equipment: readString(params, 'equipment'),
        exerciseState: readEnum(params, 'exerciseState', ['any', 'unused', 'logged'] as const, 'any'),
        exerciseLimit: readNumber(params, 'exerciseLimit', 25, 1, 100),
        exerciseOffset: readNumber(params, 'exerciseOffset', 0, 0, 100_000),
        templateQ: readString(params, 'templateQ'),
        templateState: readEnum(params, 'templateState', ['any', 'broken'] as const, 'any'),
        templateLimit: readNumber(params, 'templateLimit', 25, 1, 100),
        templateOffset: readNumber(params, 'templateOffset', 0, 0, 100_000),
      }}
    />
  );
}
