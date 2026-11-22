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
        height: height ?? (isSingle ? 40 : 30),
        flexShrink: 0,
        display: 'inline-flex',
        verticalAlign: 'middle',
        ...(!disableLink && {}),
        ...(Array.isArray(sx) ? sx : [sx]),
    };

    /**
     * The wordmark comes in two cuts: black-and-red for the light scheme,
     * white-and-red for the dark one. Both are in the page and CSS picks one
     * off the `.dark` class `InitColorSchemeScript` puts on `<html>` before
     * paint — choosing in JS would flash the wrong one until hydration.
     */
    const wordmarkSx = {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'left center',
    } as const;

    const logo = isSingle ? (
        /** The mini sidebar has 40px: too narrow for the wordmark, so the V alone. */
        <Box
            component="svg"
            viewBox="0 0 40 40"
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
        </Box>
    ) : (
        <>
            <Box
                component="img"
                src="/logo/vokve-logo-light.png"
                alt={CONFIG.appName}
                width={640}
                height={131}
                draggable={false}
                sx={{ ...wordmarkSx, '.dark &': { display: 'none' } }}
            />
            <Box
                component="img"
                src="/logo/vokve-logo-dark.png"
                alt={CONFIG.appName}
                width={640}
                height={131}
                draggable={false}
                sx={{ ...wordmarkSx, display: 'none', '.dark &': { display: 'block' } }}
            />
        </>
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