'use client';

import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { BoxProps } from '@mui/material/Box';
import Container from '@mui/material/Container';
import type { ContainerProps } from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

import { layoutClasses } from '../classes';
import { useSettingsContext } from '@/src/components';

// ----------------------------------------------------------------------

type MainProps = Omit<BoxProps, 'children' | 'sx'> & {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function Main({ children, sx, ...other }: MainProps) {
  const settings = useSettingsContext();
  const isNavHorizontal = settings.navLayout === 'horizontal';

  return (
    <Box
      component="main"
      className={layoutClasses.main}
      sx={[
        {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          ...(isNavHorizontal && {
            '--layout-dashboard-content-pt': '40px',
          }),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

type DashboardContentProps = Omit<
  ContainerProps,
  'children' | 'sx' | 'maxWidth'
> & {
  children: ReactNode;
  sx?: SxProps<Theme>;
  disablePadding?: boolean;
  maxWidth?: ContainerProps['maxWidth'];
};

export function DashboardContent({
  sx,
  children,
  disablePadding = false,
  maxWidth = 'lg',
  ...other
}: DashboardContentProps) {
  const theme = useTheme();
  const settings = useSettingsContext();

  return (
    <Container
      className={layoutClasses.content}
      maxWidth={settings.compactLayout ? maxWidth : false}
      sx={[
        {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          // A flex column child defaults to `min-width: auto`, which is what
          // let a wide table stretch the page instead of scrolling in place.
          minWidth: 0,
          pt: 'var(--layout-dashboard-content-pt)',
          pb: 'var(--layout-dashboard-content-pb)',
          [theme.breakpoints.up('lg')]: {
            px: 'var(--layout-dashboard-content-px)',
          },
          ...(disablePadding && {
            p: {
              xs: 0,
              sm: 0,
              md: 0,
              lg: 0,
              xl: 0,
            },
          }),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...other}
    >
      {children}
    </Container>
  );
}