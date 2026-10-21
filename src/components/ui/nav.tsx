'use client';

import type { ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';

import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import Typography from '@mui/material/Typography';

/**
 * A button that navigates.
 *
 * It is a client component for one hard reason: `component={Link}` passes the
 * `Link` *function* as a prop, and a function cannot cross the server→client
 * boundary — from a server component React refuses it and the element renders
 * as nothing at all. Inside a client module it is allowed, and the anchor
 * stays the real interactive element, so client-side navigation and keyboard
 * focus both behave.
 *
 * `href` is a plain string here because MUI's own `href` (from `ButtonBase`)
 * is typed `string` and wins the overload. The routes themselves are still
 * typed where they are built, in `layout/paths.ts`.
 */
export function LinkButton({
  href,
  children,
  ...rest
}: {
  href: string;
  children: ReactNode;
} & Pick<ButtonProps, 'size' | 'variant' | 'color' | 'startIcon' | 'endIcon' | 'fullWidth' | 'sx'>) {
  return (
    <Button component={Link} href={href} {...rest}>
      {children}
    </Button>
  );
}

/**
 * A link in a sentence.
 *
 * No `component` prop here: `<Link>` wraps the text instead, which works in a
 * server component and needs no client bundle at all — which is also why this
 * one keeps the typed-route generic.
 */
export function TextLink<RouteType>({
  href,
  children,
  variant = 'body2',
}: {
  href: LinkProps<RouteType>['href'];
  children: ReactNode;
  variant?: 'body2' | 'caption' | 'subtitle2';
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Typography component="span" variant={variant} sx={{ color: 'primary.main' }}>
        {children}
      </Typography>
    </Link>
  );
}
