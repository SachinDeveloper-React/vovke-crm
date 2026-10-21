import { useState, useEffect, useCallback } from 'react';

import type { ReactElement } from 'react';

import { NavItem } from './nav-item';

import { navSectionClasses } from '../classes';
import { NavUl, NavLi, NavCollapse } from '../styles';

import {
    isExternalLink,
    useActiveLink,
    usePathname,
} from '../../../routers';
import { NavItemData, NavListProps, NavSlotProps } from '../types';

// ----------------------------------------------------------------------

export function NavList({
    data,
    render,
    depth,
    slotProps,
    enabledRootRedirect,
}: NavListProps): ReactElement | null {
    const pathname = usePathname();

    const active = useActiveLink({
        pathname,
        itemPath: data.path,
        deep: !!data.children,
    });

    const [openMenu, setOpenMenu] = useState(active);

    const handleCloseMenu = useCallback(() => {
        setOpenMenu(false);
    }, []);

    useEffect(() => {
        if (!active) {
            handleCloseMenu();
        }
    }, [pathname, active, handleCloseMenu]);

    const handleToggleMenu = useCallback(() => {
        if (data.children) {
            setOpenMenu((prev) => !prev);
        }
    }, [data.children]);

    // Hidden item by role
    if (data.roles && slotProps?.currentRole) {
        if (!data.roles.includes(slotProps.currentRole)) {
            return null;
        }
    }

    const renderNavItem = (
        <NavItem
            render={render}
            path={data.path}
            icon={data.icon}
            info={data.info}
            title={data.title}
            caption={data.caption}
            depth={depth}
            active={active}
            disabled={data.disabled}
            hasChild={Boolean(data.children)}
            open={Boolean(data.children) && openMenu}
            externalLink={isExternalLink(data.path)}
            enabledRootRedirect={enabledRootRedirect}
            slotProps={{
                sx: depth === 1 ? slotProps?.rootItem : slotProps?.subItem
            }}
            onClick={handleToggleMenu}
        />
    );

    // Has children
    if (data.children) {
        return (
            <NavLi
                disabled={data.disabled}
                sx={{
                    [`& .${navSectionClasses.li}`]: {
                        '&:first-of-type': {
                            mt: 'var(--nav-item-gap)',
                        },
                    },
                }}
            >
                {renderNavItem}

                <NavCollapse
                    data-group={data.title}
                    in={openMenu}
                    depth={depth}
                    unmountOnExit
                    mountOnEnter
                >
                    <NavSubList
                        data={data.children}
                        render={render}
                        depth={depth}
                        slotProps={slotProps}
                        enabledRootRedirect={enabledRootRedirect}
                    />
                </NavCollapse>
            </NavLi>
        );


    }


    return <NavLi disabled={data.disabled}>{renderNavItem}</NavLi>;
}


type NavSubListProps = {
    data: NavItemData[];
    render?: Record<string, unknown>;
    depth: number;
    slotProps?: NavSlotProps;
    enabledRootRedirect?: boolean;
};

function NavSubList({
    data,
    render,
    depth,
    slotProps,
    enabledRootRedirect,
}: NavSubListProps): ReactElement {
    return (
        <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
            {data.map((list) => (
                <NavList
                    key={list.path}
                    data={list}
                    render={render}
                    depth={depth + 1}
                    slotProps={slotProps}
                    enabledRootRedirect={enabledRootRedirect}
                />
            ))} </NavUl>
    );
}
