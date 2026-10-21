"use client"
import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import type { CSSObject } from '@mui/system';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';

import { layoutClasses } from '../classes';
import { useSettingsContext } from '@/src/components';

// ----------------------------------------------------------------------

type CSSVariables = CSSObject & {
  [key: `--${string}`]: string | number | undefined;
};

type LayoutSectionProps = {
  sx?: SxProps<Theme>;
  cssVars?: CSSVariables;
  children: ReactNode;
  footerSection?: ReactNode;
  headerSection?: ReactNode;
  sidebarSection?: ReactNode;
  layoutQuery: 'sm' | 'md' | 'lg' | 'xl';
};

export function LayoutSection({
  sx,
  cssVars,
  children,
  footerSection,
  headerSection,
  sidebarSection,
  layoutQuery,
}: LayoutSectionProps) {
  const theme = useTheme();
  const settings = useSettingsContext();
  const isNavMini = settings.navLayout === 'mini';
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            '--layout-nav-zIndex': 1101,
            '--layout-nav-mobile-width': '320px',
            '--layout-header-blur': '8px',
            '--layout-header-zIndex': 1100,
            '--layout-header-mobile-height': '64px',
            '--layout-header-desktop-height': '72px',
            ...cssVars,
          },
        }}
      />

      <Box id="root__layout" className={layoutClasses.root} sx={{

        [`& .${layoutClasses.hasSidebar}`]: {
          [theme.breakpoints.up(layoutQuery)]: {
            transition: theme.transitions.create(['padding-left'], {
              easing: 'var(--layout-transition-easing)',
              duration: 'var(--layout-transition-duration)',
            }),
            pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
          },
        },
        ...sx,

      }}>
        {sidebarSection ? (
          <>
            {sidebarSection}

            <Box
              className={layoutClasses.hasSidebar}
              sx={{
                display: 'flex',
                flex: '1 1 auto',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              {headerSection}
              {children}
              {footerSection}
            </Box>
          </>
        ) : (
          <>
            {headerSection}
            {children}
            {footerSection}
          </>
        )}
      </Box>
    </>
  );
}