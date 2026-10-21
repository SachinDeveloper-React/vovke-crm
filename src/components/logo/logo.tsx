import type { ComponentProps } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Link from 'next/link';

import { CONFIG } from '@/src/config-global';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------
type NextLinkProps = ComponentProps<typeof Link>;

export type LogoProps = Omit<
    ComponentProps<typeof Link>,
    'href' | 'children' | 'className'
> & {
    width?: number | string;
    height?: number | string;
    href?: NextLinkProps['href'];
    isSingle?: boolean;
    disableLink?: boolean;
    className?: string;
    sx?: SxProps<Theme>;
};

export function Logo({
    width,
    href = '/',
    height,
    isSingle = false,
    disableLink = false,
    className,
    sx,
    ...other
}: LogoProps) {
    const rootSx: SxProps<Theme> = {
        width: width ?? (isSingle ? 40 : 148),
        height: height ?? (isSingle ? 40 : 36),
        flexShrink: 0,
        display: 'inline-flex',
        verticalAlign: 'middle',
        ...(!disableLink && {}),
        ...(Array.isArray(sx) ? sx : [sx]),
    };

    /**
     * Drawn rather than loaded: the panel shipped with another product's PNG
     * in `public/assets/logo`, and a wordmark in SVG is one less asset to
     * get wrong — it inherits the theme's own primary color in both schemes.
     */
    const logo = (
        <Box
            component="svg"
            viewBox={isSingle ? '0 0 40 40' : '0 0 148 36'}
            role="img"
            aria-label={CONFIG.appName}
            sx={{ display: 'block', width: '100%', height: '100%' }}
        >
            <rect width="36" height="36" rx="10" fill="var(--mui-palette-primary-main)" />
            {/* The V, as two strokes meeting at the foot. */}
            <path
                d="M10.5 11 L18 25.5 L25.5 11"
                fill="none"
                stroke="var(--mui-palette-primary-contrastText)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {!isSingle && (
                <>
                    <text
                        x="46"
                        y="20"
                        fill="var(--mui-palette-text-primary)"
                        style={{ font: '600 17px var(--font-geist-sans), system-ui, sans-serif', letterSpacing: '-0.3px' }}
                    >
                        Vokve
                    </text>
                    <text
                        x="46"
                        y="31"
                        fill="var(--mui-palette-text-disabled)"
                        style={{ font: '500 10px var(--font-geist-sans), system-ui, sans-serif', letterSpacing: '1.4px' }}
                    >
                        ADMIN
                    </text>
                </>
            )}
        </Box>
    );

    const rootClassName = [logoClasses.root, className]
        .filter(Boolean)
        .join(' ');

    if (disableLink) {
        return (
            <Box
                className={rootClassName}
                aria-label="Logo"
                sx={rootSx}
            >
                {logo}
            </Box>
        );
    }

    // `component={Link}` would hand a function to a client component, which
    // React refuses across the server boundary — so the link wraps the mark
    // instead of replacing its element.
    return (
        <Link href={href} aria-label="Logo" style={{ display: 'inline-flex' }} {...other}>
            <Box className={rootClassName} sx={rootSx}>
                {logo}
            </Box>
        </Link>
    );
}