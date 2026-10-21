
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import { useTheme } from '@mui/material/styles';


import { NavItem } from './nav-item';
import { NavUl, NavLi } from '../styles';
import { navSectionClasses } from '../classes';

import type {
    NavListProps,
    NavSubListProps,
} from '../types';
import { usePathname } from 'next/navigation';
import { isExternalLink, useActiveLink } from '@/src/routers';
import { Scrollbar } from '../../scrollbar';
import { paper } from '@/src/theme';

// ----------------------------------------------------------------------

export function NavList({
    data,
    depth,
    render,
    cssVars,
    slotProps,
    enabledRootRedirect,
}: NavListProps) {
    const theme = useTheme();
    const pathname = usePathname();

    const navItemRef = useRef<HTMLButtonElement | null>(null);

    const active = useActiveLink({
        itemPath: data.path,
        pathname: pathname,
        deep: !!data.children
    });

    const [openMenu, setOpenMenu] = useState(false);

    const handleCloseMenu = useCallback(() => {
        setOpenMenu(false);
    }, []);

    const handleOpenMenu = useCallback(() => {
        if (data.children) {
            setOpenMenu(true);
        }
    }, [data.children]);

    useEffect(() => {
        if (openMenu) {
            handleCloseMenu();
        }
    }, [pathname]);

    // ----------------------------------------------------------------------

    const renderNavItem = (
        <NavItem
            ref={navItemRef}
            render={render}
            path={data.path}
            icon={data.icon}
            info={data.info}
            title={data.title}
            caption={data.caption}
            depth={depth}
            active={active}
            disabled={data.disabled}
            hasChild={!!data.children}
            open={!!data.children && openMenu}
            externalLink={isExternalLink(data.path)}
            enabledRootRedirect={enabledRootRedirect}
            onMouseEnter={handleOpenMenu}
            onMouseLeave={handleCloseMenu}
        />
    );

    // ----------------------------------------------------------------------
    // Hidden item by role
    // ----------------------------------------------------------------------

    if (data.roles && slotProps?.currentRole) {
        if (!data.roles.includes(slotProps.currentRole)) {
            return null;
        }
    }


    // ----------------------------------------------------------------------
    // Has children
    // ----------------------------------------------------------------------

    if (data.children) {
        return (
            <NavLi disabled={data.disabled}>
                {renderNavItem}

                <Popover
                    disableScrollLock
                    open={openMenu}
                    anchorEl={navItemRef.current}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                    slotProps={{
                        paper: {
                            onMouseEnter: handleOpenMenu,
                            onMouseLeave: handleCloseMenu,
                            sx: {
                                px: 0.75,
                                boxShadow: 'none',
                                overflow: 'unset',
                                backdropFilter: 'none',
                                background: 'transparent',
                                ...(depth > 1 && { mt: -1 }),
                                ...(openMenu && { pointerEvents: 'auto' }),
                            },
                        },
                    }}
                    sx={{
                        ...cssVars,
                        pointerEvents: 'none',
                    }}
                >
                    <Paper
                        className={navSectionClasses.paper}
                        sx={{
                            minWidth: 280,
                            ...paper({ theme, dropdown: true }),
                            ...slotProps?.paper,
                        }}
                    >
                        <NavSubList
                            data={data.children}
                            depth={depth}
                            render={render}
                            cssVars={cssVars}
                            slotProps={slotProps}
                            enabledRootRedirect={enabledRootRedirect}
                        />
                    </Paper>
                </Popover>
            </NavLi>
        );
    }

    // ----------------------------------------------------------------------
    // Default
    // ----------------------------------------------------------------------

    return <NavLi disabled={data.disabled}>{renderNavItem}</NavLi>;
}

// ----------------------------------------------------------------------

function NavSubList({
    data,
    render,
    depth,
    slotProps,
    enabledRootRedirect,
    cssVars,
}: NavSubListProps) {
    return (
        <NavUl sx={{ gap: 0.5, maxHeight: '90vh' }}>
            <Scrollbar>
                {data.map((list) => (
                    <NavList
                        key={list.path}
                        data={list}
                        render={render}
                        depth={depth + 1}
                        cssVars={cssVars}
                        slotProps={slotProps}
                        enabledRootRedirect={enabledRootRedirect}
                    />
                ))}
            </Scrollbar>
        </NavUl>
    );
}
