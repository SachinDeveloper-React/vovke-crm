import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ListSubheader from '@mui/material/ListSubheader';

import type { BoxProps } from '@mui/material/Box';
import type { CollapseProps } from '@mui/material/Collapse';
import type { ListSubheaderProps } from '@mui/material/ListSubheader';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { navSectionClasses } from './classes';
import { svgColorClasses } from '../svg-color';
import { iconifyClasses } from '../iconify/classes';
import { Iconify } from '../iconify/iconify';
import { stylesMode } from '@/src/theme';

// ----------------------------------------------------------------------

type NavItemState = {
  open?: boolean;
  active?: boolean;
  disabled?: boolean;
};

export function stateClasses({
  open,
  active,
  disabled,
}: NavItemState): string {
  let classes = navSectionClasses.item.root;

  if (active) {
    classes += ` ${navSectionClasses.state.active}`;
  } else if (open) {
    classes += ` ${navSectionClasses.state.open}`;
  } else if (disabled) {
    classes += ` ${navSectionClasses.state.disabled}`;
  }

  return classes;
}

// ----------------------------------------------------------------------

export const sharedStyles = {
  icon: {
    flexShrink: 0,
    display: 'inline-flex',
    [`& svg, & img, & .${iconifyClasses.root}, & .${svgColorClasses.root}`]: {
      width: '100%',
      height: '100%',
    },
  },

  arrow: {
    width: 16,
    height: 16,
    flexShrink: 0,
    marginLeft: '6px',
    display: 'inline-flex',
  },

  info: {
    fontSize: 12,
    flexShrink: 0,
    fontWeight: 600,
    marginLeft: '6px',
    lineHeight: 18 / 12,
    display: 'inline-flex',
  },

  noWrap: {
    width: '100%',
    maxWidth: '100%',
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },

  disabled: {
    opacity: 0.48,
    pointerEvents: 'none',
  },
} satisfies Record<string, SxProps<Theme>>;

// ----------------------------------------------------------------------

type SubheaderProps = Omit<ListSubheaderProps, 'open' | 'sx'> & {
  sx?: SxProps<Theme>;
  open?: boolean;
  children?: ReactNode;
};

export function Subheader({
  sx,
  open = false,
  children,
  ...other
}: SubheaderProps) {
  return (
    <ListSubheader
      disableSticky
      component="div"
      className={navSectionClasses.subheader}
      sx={[
        {
          gap: 1,
          cursor: 'pointer',
          alignItems: 'center',
          position: 'relative',
          typography: 'overline',
          display: 'inline-flex',
          alignSelf: 'flex-start',
          color: 'var(--nav-subheader-color)',
          padding: (theme) => theme.spacing(2, 1, 1, 1.5),
          fontSize: (theme) => theme.typography.pxToRem(11),
          transition: (theme) =>
            theme.transitions.create(['color', 'padding-left'], {
              duration: theme.transitions.duration.standard,
            }),
          '&:hover': {
            pl: 2,
            color: 'var(--nav-subheader-hover-color)',
            [`& .${iconifyClasses.root}`]: {
              opacity: 1,
            },
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...other}
    >
      <Iconify
        width={16}
        icon={
          open
            ? 'eva:arrow-ios-downward-fill'
            : 'eva:arrow-ios-forward-fill'
        }
        sx={{
          left: -4,
          opacity: 0,
          position: 'absolute',
          transition: (theme) =>
            theme.transitions.create(['opacity'], {
              duration: theme.transitions.duration.standard,
            }),
        }}
      />

      {children}
    </ListSubheader>
  );
}

// ----------------------------------------------------------------------

type NavCollapseProps = Omit<CollapseProps, 'sx'> & {
  sx?: SxProps<Theme>;
  depth: number;
  children?: ReactNode;
};

export function NavCollapse({
  sx,
  depth,
  children,
  ...other
}: NavCollapseProps) {
  return (
    <Collapse
      sx={[
        {
          ...(depth > 0 && {
            pl: 'calc(var(--nav-item-pl) + var(--nav-icon-size) / 2)',
            [`& .${navSectionClasses.ul}`]: {
              position: 'relative',
              pl: 'var(--nav-bullet-size)',
              '&::before': {
                top: 0,
                left: 0,
                width: '2px',
                content: '""',
                position: 'absolute',
                bottom:
                  'calc(var(--nav-item-sub-height) - 2px - var(--nav-bullet-size) / 2)',
                bgcolor: 'var(--nav-bullet-light-color)',
                [stylesMode.dark]: {
                  bgcolor: 'var(--nav-bullet-dark-color)',
                },
              },
            },
          }),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...other}
    >
      {children}
    </Collapse>
  );
}

// ----------------------------------------------------------------------

type NavLiProps = Omit<BoxProps<'li'>, 'component' | 'sx'> & {
  sx?: SxProps<Theme>;
  disabled?: boolean;
  children?: ReactNode;
};

export function NavLi({
  sx,
  children,
  disabled = false,
  ...other
}: NavLiProps) {
  return (
    <Box
      component="li"
      className={navSectionClasses.li}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          ...(disabled && {
            cursor: 'not-allowed',
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

type NavUlProps = Omit<BoxProps<'ul'>, 'component' | 'sx'> & {
  sx?: SxProps<Theme>;
  children?: ReactNode;
};

export function NavUl({ children, sx, ...other }: NavUlProps) {
  return (
    <Box
      component="ul"
      className={navSectionClasses.ul}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}
