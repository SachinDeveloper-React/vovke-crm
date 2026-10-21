
'use client';

import type { ReactNode } from 'react';

import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import { styled, useTheme } from '@mui/material/styles';
import { iconButtonClasses } from '@mui/material/IconButton';

import { useSettingsContext } from '@/src/components';

import { useScrollOffSetTop } from '@/src/hooks';
import { varAlpha, bgBlur } from '@/src/theme';

const StyledElevation = styled('span')(({ theme }) => ({
    left: 0,
    right: 0,
    bottom: 0,
    margin: 'auto',
    height: 24,
    zIndex: -1,
    opacity: 0.48,
    borderRadius: '50%',
    position: 'absolute',
    width: 'calc(100% - 48px)',
    boxShadow: theme.customShadows.z8,
}));

type Props = {
    children: ReactNode;
    layoutQuery: 'sm' | 'md' | 'lg' | 'xl';
    disableOffset: boolean;
    disableElevation: boolean;
    toolbarSx?: object;
    containerMaxWidth?: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    containerSx?: object;
};

export function DashboardHeaderToolbar({
    children,
    layoutQuery,
    disableOffset,
    disableElevation,
    toolbarSx,
    containerMaxWidth = false,
    containerSx,
}: Props) {
    const theme = useTheme();
    const settings = useSettingsContext();

    const { offsetTop } = useScrollOffSetTop();
    const isNavHorizontal = settings.navLayout === 'horizontal';
    const isNavMini = settings.navLayout === 'mini';
    const isNavVertical = isNavMini || settings.navLayout === 'vertical';

    const toolbarStyles = {
        minHeight: 'auto',
        height: 'var(--layout-header-mobile-height)',
        transition: theme.transitions.create(
            ['height', 'background-color', 'backdrop-filter'],
            {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.shorter,
            }
        ),
        [theme.breakpoints.up('sm')]: {
            minHeight: 'auto',
        },
        [theme.breakpoints.up(layoutQuery)]: {
            height: 'var(--layout-header-desktop-height)',
        },
    };

    return (
        <>
            <Toolbar
                disableGutters
                sx={{
                    ...toolbarStyles,

                    ...(isNavHorizontal && {
                        bgcolor: 'var(--layout-nav-bg)',

                        [`& .${iconButtonClasses.root}`]: {
                            color: 'var(--layout-nav-text-secondary-color)',
                        },

                        [theme.breakpoints.up(layoutQuery)]: {
                            height: 'var(--layout-nav-horizontal-height)',
                        },
                    }),

                    ...(!disableOffset &&
                        offsetTop && {
                        ...bgBlur({
                            color: varAlpha(
                                theme.vars.palette.background.defaultChannel,
                                0.8
                            ),
                        }),
                    }),


                    ...(isNavHorizontal && {
                        bgcolor: 'var(--layout-nav-bg)',
                        [`& .${iconButtonClasses.root}`]: {
                            color: 'var(--layout-nav-text-secondary-color)',
                        },
                        [theme.breakpoints.up(layoutQuery)]: {
                            height: 'var(--layout-nav-horizontal-height)',
                        },
                    }),

                    ...toolbarSx,
                }}
            >
                <Container
                    maxWidth={containerMaxWidth}
                    sx={{
                        height: 1,
                        display: 'flex',
                        alignItems: 'center',
                        ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
                        ...containerSx,
                    }}
                >
                    {children}
                </Container>
            </Toolbar>

            {!disableElevation && offsetTop && (
                <StyledElevation />
            )}
        </>
    );
}

