"use client"
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import { layoutClasses } from '../classes';
import { DashboardHeaderToolbar } from './dashboard-header-toolbar';
import { useTheme } from '@mui/material/styles';
import { useScrollOffSetTop } from '@/src/hooks';
import { bgBlur, varAlpha } from '@/src/theme';

type DashboardHeaderProps = {
  layoutQuery?: 'sm' | 'md' | 'lg' | 'xl';
  disableOffset?: boolean;
  disableElevation?: boolean;
  sx?: object;
  slots?: {
    topArea?: React.ReactNode;
    leftArea?: React.ReactNode;
    centerArea?: React.ReactNode;
    rightArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  slotProps?: {
    toolbar?: {
      sx?: object;
    };
    container?: {
      maxWidth?: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
      sx?: object;
    };
  };
};

export function DashboardHeader({
  layoutQuery = 'md',
  disableOffset = false,
  disableElevation = false,
  sx,
  slots,
  slotProps,
}: DashboardHeaderProps) {
  const theme = useTheme();
  const { offsetTop } = useScrollOffSetTop();
  return (
    <AppBar
      color="transparent"
      elevation={0}
      position="sticky"
      className={layoutClasses.header}
      sx={{
        zIndex: 'var(--layout-header-zIndex)',
        backgroundColor: theme.vars.palette.background.default,
        backgroundImage: 'none',

        ...(!disableOffset &&
          offsetTop && {
          ...bgBlur({
            color: varAlpha(
              theme.vars.palette.background.defaultChannel,
              0.8
            ),
          }),
        }),

        ...sx,
      }}
    >
      {slots?.topArea}

      <DashboardHeaderToolbar
        layoutQuery={layoutQuery}
        disableOffset={disableOffset}
        disableElevation={disableElevation}
        toolbarSx={slotProps?.toolbar?.sx}
        containerMaxWidth={slotProps?.container?.maxWidth}
        containerSx={slotProps?.container?.sx}
      >
        {slots?.leftArea}

        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            justifyContent: 'center',
          }}
        >
          {slots?.centerArea}
        </Box>

        {slots?.rightArea}
      </DashboardHeaderToolbar>

      {slots?.bottomArea}
    </AppBar>
  );
}
