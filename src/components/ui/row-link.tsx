import type { ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';

import Typography from '@mui/material/Typography';

/**
 * A name in a table that opens the thing it names.
 *
 * The link is the outer element rather than `Typography component={Link}`:
 * with typed routes a dynamic href cannot be inferred through MUI's
 * `component` prop, and wrapping is the better markup anyway — the whole name
 * is the hit target.
 */
export function RowLink<RouteType>({
  href,
  children,
  secondary,
}: {
  href: LinkProps<RouteType>['href'];
  children: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.primary', '&:hover': { color: 'primary.main' } }}>
        {children}
      </Typography>
      {secondary && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {secondary}
        </Typography>
      )}
    </Link>
  );
}
