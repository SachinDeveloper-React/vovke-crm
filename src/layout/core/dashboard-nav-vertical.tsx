"use client"
import { useSettingsContext } from "@/src/components"
import { hideScrollY, varAlpha } from "@/src/theme"
import Box from "@mui/material/Box"
import { SxProps, Theme, useTheme } from "@mui/material/styles"
import { NavToggleButton } from "../components/nav-toggle-button"
import { useCallback, useMemo } from "react"
import { Scrollbar } from "@/src/components/scrollbar"
import { NavUpgrade } from "../components/nav-upgrade"
import { NavSectionVertical } from "@/src/components/nav-section/vertical"
import { navData } from "../config-nav-dashboard"
import { Logo } from "@/src/components/logo"
import { NavSectionMini } from "@/src/components/nav-section/mini"

const DasboardNavVertical = ({ layoutQuery, sx }: { layoutQuery: 'sm' | 'md' | 'lg' | 'xl', sx?: SxProps<Theme> }) => {
    const theme = useTheme();
    const settings = useSettingsContext();
    const isNavMini = settings.navLayout === 'mini';
    const onToggleNav = useCallback(() => {
        settings.onUpdateField(
            'navLayout',
            settings.navLayout === 'vertical' ? 'mini' : 'vertical'
        )
    }, [settings])


    const renderNavVertical = useMemo(() => {
        return (
            <>

                <Box sx={{ pl: 3.5, pt: 2.5, pb: 1 }}>
                    <Logo/>
                </Box>

                <Scrollbar fillContent>
                    <NavSectionVertical data={navData} sx={{ px: 2, flex: '1 1 auto' }} />

                    <NavUpgrade />
                </Scrollbar>
            </>
        );
    }, [])
    const renderNavMini = useMemo(() => {
        return (
            <>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5 }}>
                    <Logo isSingle/>
                </Box>

                <Scrollbar fillContent>
                    <NavSectionMini data={navData}
                     sx={{ pb: 2, px: 0.5, ...hideScrollY, flex: '1 1 auto', overflowY: 'auto' }}
                    />
                </Scrollbar>
            </>
        );
    }, [])



    return (
        <Box
            sx={{
                top: 0,
                left: 0,
                height: 1,
                display: 'none',
                position: 'fixed',
                flexDirection: 'column',
                bgcolor: 'var(--layout-nav-bg)',
                zIndex: 'var(--layout-nav-zIndex)',
                width: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
                borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
                transition: theme.transitions.create(['width'], {
                    easing: 'var(--layout-transition-easing)',
                    duration: 'var(--layout-transition-duration)',
                }),
                [theme.breakpoints.up(layoutQuery)]: {
                    display: 'flex',
                },
                ...sx,
            }}
        >
            <NavToggleButton
                isNavMini={isNavMini}
                onClick={onToggleNav}
                sx={{
                    display: 'none',
                    [theme.breakpoints.up(layoutQuery)]: {
                        display: 'inline-flex',
                    },
                }}
            />
            {isNavMini ? renderNavMini : renderNavVertical}
        </Box>
    )
}

export default DasboardNavVertical 