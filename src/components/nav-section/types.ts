
import type { MouseEventHandler, ReactElement, ReactNode } from 'react';
import type { CSSProperties, SxProps, Theme } from '@mui/material/styles';


export type NavInfo = [key: string, value: string | number];

export type NavRender = {
  navIcon?: Record<string, ReactNode>;
  navInfo?: (
    value: string | number
  ) => Record<string, ReactElement | undefined>;
};


export type NavItemData = {
  path: string;
  title: string;
  icon?: string | ReactElement | null;
  info?: NavInfo | ReactNode;
  caption?: string;
  disabled?: boolean;
  roles?: string[];
  meta?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  subheader?: string;
  meta?: string;
  path?: string;
  items: NavItemData[];
};

export type NavSlotProps = {
  subheader?: SxProps<Theme>;
  rootItem?: SxProps<Theme>;
  subItem?: SxProps<Theme>;
  currentRole?: string;
  paper?: SxProps<Theme>;
};

export type NavItemSlotProps = {
  sx?: SxProps<Theme>;
  icon?: SxProps<Theme>;
  title?: SxProps<Theme>;
  caption?: SxProps<Theme>;
  info?: SxProps<Theme>;
  arrow?: SxProps<Theme>;
};

export type NavItemProps = {
  path: string;
  icon?: ReactNode;
  info?: ReactNode;
  title?: ReactNode;
  caption?: string;
  open?: boolean;
  depth: number;
  render?: NavRender;
  active?: boolean;
  disabled?: boolean;
  hasChild?: boolean;
  slotProps?: NavItemSlotProps;
  externalLink?: boolean;
  enabledRootRedirect?: boolean;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
};

export type UseNavItemProps = {
  path: string;
  icon?: ReactNode;
  info?: NavInfo | ReactNode;
  depth: number;
  render?: NavRender;
  hasChild?: boolean;
  externalLink?: boolean;
  enabledRootRedirect?: boolean;
};


export type NavSectionVerticalProps = {
  sx?: SxProps<Theme>;
  data: NavGroupData[];
  render?: Record<string, unknown>;
  slotProps?: NavSlotProps;
  enabledRootRedirect?: boolean;
  cssVars?: Record<string, string | number>;
};

export type NavListProps = {
  data: NavItemData;
  render?: Record<string, unknown>;
  depth: number;
  slotProps?: NavSlotProps;
  enabledRootRedirect?: boolean;
  cssVars?: SxProps<Theme>;
  path?: string | undefined;
};

export type NavSubListProps = {
  data: NavItemData[];
  render?: NavRender;
  depth: number;
  slotProps?: NavSlotProps;
  enabledRootRedirect?: boolean;
  cssVars?: SxProps<Theme>;
};

export type StyledNavItemProps = {
  active?: boolean;
  open?: boolean;
  disabled?: boolean;
  depth?: number;
};

// ------------------------------- MINI -------------------------------



export type NavSectionMiniProps = {
  sx?: SxProps<Theme>;
  data: NavGroupData[];
  render?: NavRender;
  slotProps?: NavSlotProps;
  enabledRootRedirect?: boolean;
  cssVars?: Record<string, string | number>;
};

