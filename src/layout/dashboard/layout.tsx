import type { ReactNode } from 'react';

import { LayoutSection } from '../core/layout-section';
import DasboardNavVertical from '../core/dashboard-nav-vertical';
import { Main } from './main';
import { DashboardHeader } from '../core/dashboard-header';
import { RightArea } from '../components/right-area';
import { ADMIN_TIMEZONE, API_BASE } from '@/src/lib/api';

type DashboardLayoutProps = {
  children: ReactNode;
};

const layoutQuery: 'sm' | 'md' | 'lg' | 'xl' = "lg"

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <LayoutSection
      layoutQuery={layoutQuery}
      headerSection={<DashboardHeader
        layoutQuery={layoutQuery}
        disableElevation={false}
        slots={{
          topArea: null,
          leftArea: null,
          rightArea: <RightArea apiBase={API_BASE} timezone={ADMIN_TIMEZONE} />,
          bottomArea: null,
        }}
      />}
      sidebarSection={<DasboardNavVertical layoutQuery={layoutQuery}/>}
      cssVars={{
        '--layout-transition-easing': 'linear',
        '--layout-transition-duration': '120ms',
        '--layout-nav-mini-width': '88px',
        '--layout-nav-vertical-width': '300px',
        '--layout-nav-horizontal-height': '64px',
        '--layout-dashboard-content-pt': '8px',
        '--layout-dashboard-content-pb': '64px',
        '--layout-dashboard-content-px': '40px',
      }}
    >
      <Main>
        {children}
      </Main>
    </LayoutSection>
  );
}