
import { forwardRef } from 'react';

import type { ReactElement, ReactNode } from 'react';

import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { styled } from '@mui/material/styles';

import type { SxProps, Theme } from '@mui/material/styles';
import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { navSectionClasses } from '../classes';
import { stateClasses, sharedStyles } from '../styles';
import { useNavItem } from '../hooks';
import { Iconify } from '../../iconify/iconify';

import { stylesMode } from '@/src/theme';

// ----------------------------------------------------------------------

type NavSlotProps = {
    sx?: SxProps<Theme>;
    icon?: SxProps<Theme>;
    texts?: SxProps<Theme>;
    title?: SxProps<Theme>;
    caption?: SxProps<Theme>;
    info?: SxProps<Theme>;
    arrow?: SxProps<Theme>;
};

type NavItemProps = Omit<
    ButtonBaseProps,
    'title' | 'children' | 'disabled' | 'open'
> & {
    path: string;
    icon?: string | ReactElement | null;
    info?: Parameters<typeof useNavItem>[0]['info'];
    title?: ReactNode;
    caption?: ReactNode;
    open?: boolean;
    depth: number;
    render?: Parameters<typeof useNavItem>[0]['render'];
    active?: boolean;
    disabled?: boolean;
    hasChild?: boolean;
    externalLink?: boolean;
    enabledRootRedirect?: boolean;
    slotProps?: NavSlotProps;
};

// ----------------------------------------------------------------------

type StyledNavItemProps = {
    active?: boolean;
    open?: boolean;
    depth: number;
    disabled?: boolean;
};

// ----------------------------------------------------------------------

export const NavItem = forwardRef<HTMLButtonElement, NavItemProps>(
    (
        {
            path,
            icon,
            info,
            title,
            caption,
            open = false,
            depth,
            render,
            active = false,
            disabled = false,
            hasChild = false,
            slotProps,
            externalLink = false,
            enabledRootRedirect = false,
            ...other
        },
        ref
    ) => {
        const navItem = useNavItem({
            path,
            icon,
            info,
            depth,
            render,
            hasChild,
            externalLink,
            enabledRootRedirect,
        });

        const isOpen = open && !active;

        return (
            <StyledNavItem
                ref={ref}
                aria-label={typeof title === 'string' ? title : undefined}
                depth={depth}
                active={active}
                disabled={disabled}
                open={isOpen}
                sx={[
                    {
                        [`& .${navSectionClasses.item.icon}`]: slotProps?.icon,
                        [`& .${navSectionClasses.item.texts}`]: slotProps?.texts,
                        [`& .${navSectionClasses.item.title}`]: slotProps?.title,
                        [`& .${navSectionClasses.item.caption}`]: slotProps?.caption,
                        [`& .${navSectionClasses.item.info}`]: slotProps?.info,
                        [`& .${navSectionClasses.item.arrow}`]: slotProps?.arrow,
                    },
                    ...(Array.isArray(slotProps?.sx)
                        ? slotProps.sx
                        : slotProps?.sx
                            ? [slotProps.sx]
                            : []),
                ]}
                className={stateClasses({
                    open: isOpen,
                    active,
                    disabled,
                })}
                {...navItem.baseProps}
                {...other}
            >
                {icon && (
                    <Box
                        component="span"
                        className={navSectionClasses.item.icon}
                    >
                        {navItem.renderIcon}
                    </Box>
                )}

                {title && (
                    <Box
                        component="span"
                        className={navSectionClasses.item.texts}
                    >
                        <Box
                            component="span"
                            className={navSectionClasses.item.title}
                        >
                            {title}
                        </Box>

                        {caption && (
                            <Tooltip title={caption} placement="top-start">
                                <Box
                                    component="span"
                                    className={navSectionClasses.item.caption}
                                >
                                    {caption}
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                )}

                {info && (
                    <Box
                        component="span"
                        className={navSectionClasses.item.info}
                    >
                        {navItem.renderInfo}
                    </Box>
                )}

                {hasChild && (
                    <Iconify
                        icon={
                            isOpen
                                ? 'eva:arrow-ios-downward-fill'
                                : 'eva:arrow-ios-forward-fill'
                        }
                        className={navSectionClasses.item.arrow}
                    />
                )}
            </StyledNavItem>
        );
    }
);

NavItem.displayName = 'NavItem';

// ----------------------------------------------------------------------

const StyledNavItem = styled(ButtonBase, {
    shouldForwardProp: (prop) =>
        prop !== 'active' &&
        prop !== 'open' &&
        prop !== 'depth' &&
        prop !== 'ownerState',
})<StyledNavItemProps>(({ active, open, disabled, depth, theme }) => {
    const rootItem = depth === 1;
    const subItem = !rootItem;

    const baseStyles = {
        item: {
            ...theme.typography.caption,
            width: '100%',
            paddingTop: 'var(--nav-item-pt)',
            paddingLeft: 'var(--nav-item-pl)',
            paddingRight: 'var(--nav-item-pr)',
            paddingBottom: 'var(--nav-item-pb)',
            borderRadius: 'var(--nav-item-radius)',
            color: 'var(--nav-item-color)',

            '&:hover': {
                backgroundColor: 'var(--nav-item-hover-bg)',
            },
        },

        texts: {
            minWidth: 0,
            flex: '1 1 auto',
        },

        title: {
            ...sharedStyles.noWrap,
            ...theme.typography.body2,
            fontWeight: active
                ? theme.typography.fontWeightSemiBold
                : theme.typography.fontWeightMedium,
        },

        subtitle: {
            ...sharedStyles.noWrap,
            ...theme.typography.caption,
            fontWeight: active
                ? theme.typography.fontWeightSemiBold
                : theme.typography.fontWeightMedium,
        },

        caption: {
            ...sharedStyles.noWrap,
            ...theme.typography.caption,
            color: 'var(--nav-item-caption-color)',
        },

        icon: {
            ...sharedStyles.icon,
            width: 'var(--nav-icon-size)',
            height: 'var(--nav-icon-size)',
            margin: 'var(--nav-icon-margin)',
        },

        arrow: {
            ...sharedStyles.arrow,
        },

        info: {
            ...sharedStyles.info,
        },
    };

    return {
        // Root item
        ...(rootItem && {
            ...baseStyles.item,

            minHeight: 'var(--nav-item-root-height)',

            [`& .${navSectionClasses.item.icon}`]: {
                ...baseStyles.icon,
            },

            [`& .${navSectionClasses.item.texts}`]: {
                ...baseStyles.texts,
            },

            [`& .${navSectionClasses.item.title}`]: {
                ...baseStyles.title,
            },

            [`& .${navSectionClasses.item.caption}`]: {
                ...baseStyles.caption,
            },

            [`& .${navSectionClasses.item.arrow}`]: {
                ...baseStyles.arrow,
            },

            [`& .${navSectionClasses.item.info}`]: {
                ...baseStyles.info,
            },

            // State
            ...(active && {
                color: 'var(--nav-item-root-active-color)',
                backgroundColor: 'var(--nav-item-root-active-bg)',

                '&:hover': {
                    backgroundColor: 'var(--nav-item-root-active-hover-bg)',
                },

                [stylesMode.dark]: {
                    color: 'var(--nav-item-root-active-color-on-dark)',
                },
            }),

            ...(open && {
                color: 'var(--nav-item-root-open-color)',
                backgroundColor: 'var(--nav-item-root-open-bg)',
            }),
        }),

        // Sub item
        ...(subItem && {
            ...baseStyles.item,

            minHeight: 'var(--nav-item-sub-height2)',

            [`& .${navSectionClasses.item.icon}`]: {
                ...baseStyles.icon,
            },

            [`& .${navSectionClasses.item.texts}`]: {
                ...baseStyles.texts,
            },

            [`& .${navSectionClasses.item.title}`]: {
                ...baseStyles.subtitle,
            },

            [`& .${navSectionClasses.item.caption}`]: {
                ...baseStyles.caption,
            },

            [`& .${navSectionClasses.item.arrow}`]: {
                ...baseStyles.arrow,
            },

            [`& .${navSectionClasses.item.info}`]: {
                ...baseStyles.info,
            },

            // Shape
            '&::before': {
                left: 0,
                content: '""',
                position: 'absolute',
                width: 'var(--nav-bullet-size)',
                height: 'var(--nav-bullet-size)',

                transform:
                    'translate(calc(var(--nav-bullet-size) * -1), calc(var(--nav-bullet-size) * -0.4))',

                backgroundColor: 'var(--nav-bullet-light-color)',

                mask:
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23efefef' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat 50% 50%/100% auto`,

                WebkitMask:
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23efefef' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat 50% 50%/100% auto`,

                [stylesMode.dark]: {
                    backgroundColor: 'var(--nav-bullet-dark-color)',
                },
            },

            // State
            ...(active && {
                color: 'var(--nav-item-sub-active-color)',
                backgroundColor: 'var(--nav-item-sub-active-bg)',
            }),

            ...(open && {
                color: 'var(--nav-item-sub-open-color)',
                backgroundColor: 'var(--nav-item-sub-open-bg)',
            }),
        }),

        // Disabled
        ...(disabled && sharedStyles.disabled),
    };
});
