import { StaffProvider } from "@/src/components/staff/staff-context";
import { GuideIndexProvider } from "@/src/components/ui/section-guide";
import { DashboardLayout } from "@/src/layout/dashboard/layout";
import { guideIndex } from "@/src/layout/section-guides";

/**
 * Every page's one-line guide question goes down from here, once per full
 * load; the guide text itself is fetched by the card on its first Read.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GuideIndexProvider entries={guideIndex()}>
      {/* Who is signed in, so the menu shows only what they may open (RULES Z9). */}
      <StaffProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </StaffProvider>
    </GuideIndexProvider>
  );
}
