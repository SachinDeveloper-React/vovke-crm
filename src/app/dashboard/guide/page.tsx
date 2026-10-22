import { PageHeader } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { GuideView } from '@/src/sections/guide/view';

export const metadata = { title: 'Guide · Vokve Admin' };

/**
 * The tour. No `<Suspense>` boundary and no loader, unlike every other page
 * here: there is nothing to fetch. The whole guide is
 * `layout/section-guides.ts`, which is also what each page reads to draw its
 * own copy at the top of itself.
 */
export default function Page() {
  return (
    <DashboardContent maxWidth="lg">
      <PageHeader
        title="Guide"
        subtitle="What every page of this panel is for, how it is used, and what it refuses to do."
      />
      <GuideView />
    </DashboardContent>
  );
}
