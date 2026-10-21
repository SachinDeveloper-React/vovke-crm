import Link from 'next/link';

import { cloneElement } from 'react';

import type {  ReactNode } from 'react';
import { UseNavItemProps } from './types';


export function useNavItem({
  path,
  icon,
  info,
  depth,
  render,
  hasChild = false,
  externalLink = false,
  enabledRootRedirect = false,
}: UseNavItemProps) {
  const rootItem = depth === 1;
  const subItem = !rootItem;
  const subDeepItem = depth > 2;

  const linkProps = externalLink
    ? {
        href: path,
        target: '_blank' as const,
        rel: 'noopener',
      }
    : {
        component: Link,
        href: path,
      };

  const baseProps =
    hasChild && !enabledRootRedirect
      ? { component: 'div' as const }
      : linkProps;

  // Render icon
  let renderIcon: ReactNode = null;

  if (icon && render?.navIcon && typeof icon === 'string') {
    renderIcon = render.navIcon[icon] ?? null;
  } else {
    renderIcon = icon;
  }

  // Render info
  let renderInfo: ReactNode = null;

  if (info && render?.navInfo && Array.isArray(info)) {
    const [key, value] = info;
    const element = render.navInfo(value)[key];

    renderInfo = element ? cloneElement(element) : null;
  } else {
    renderInfo = info as ReactNode;
  }

  return {
    subItem,
    rootItem,
    subDeepItem,
    baseProps,
    renderIcon,
    renderInfo,
  };
}
