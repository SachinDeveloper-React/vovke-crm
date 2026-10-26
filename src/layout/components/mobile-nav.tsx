'use client';

import { useCallback, useState } from 'react';

import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

import { Logo } from '@/src/components/logo';
import { NavSectionVertical } from '@/src/components/nav-section/vertical';
import { Scrollbar } from '@/src/components/scrollbar';

import { navData } from '../config-nav-dashboard';

/**
 * The sidebar on a phone, and the button that opens it.
 *
 * The vertical nav is `display: none` below the layout's breakpoint — it is a
 * 300px column, and there is no room for it beside the page. Which left the
 * panel with *no navigation at all* on a phone: every page was reachable only
 * by typing the URL. This is that missing half: the same `navData`, in a
 * drawer, behind a hamburger in the header.
 *
 * The two live in one component because they share one piece of state and
 * nothing else needs it. Both disappear at the breakpoint where the real
 * sidebar appears, so the button is never a second way to the same column.
 *
 * It closes on any click inside the list rather than on a route change: every
 * row in `navData` is a link with no children, so a click is always a
 * navigation, and watching the pathname would mean an effect that sets state
 * on the way past.
 *
 * The glyph is the **bundled** MUI one rather than this panel's `Iconify`,
 * which is the only place in the panel that matters. `Iconify` fetches each
 * icon from api.iconify.design on the client and renders an empty box behind
 * `NoSsr` until it arrives — fine for a glyph beside a label, and not fine
 * for the one control that makes the panel navigable at all: a browser that
 * cannot reach the API (or has every *other* icon in its cache already) shows
 * a 40px circle of nothing where the menu button should be. This one is in
 * the bundle, draws server-side, and cannot go missing.
 */
export function MobileNav({ layoutQuery }: { layoutQuery: 'sm' | 'md' | 'lg' | 'xl' }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  return (
    <>
      <IconButton
        onClick={show}
        aria-label="Open the menu"
        sx={{
          mr: 1,
          ml: -1,
          color: 'text.primary',
          [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        open={open}
        onClose={hide}
        slotProps={{
          paper: {
            sx: {
              // The sidebar's own width (`--layout-nav-vertical-width`),
              // written out because a drawer is portalled to the body and
              // the layout's CSS variables do not reach it.
              width: 300,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
        sx={{ [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
      >
        <Box sx={{ pl: 3.5, pt: 2.5, pb: 1 }}>
          <Logo />
        </Box>

        <Scrollbar fillContent>
          <Box onClick={hide}>
            <NavSectionVertical data={navData} sx={{ px: 2, flex: '1 1 auto' }} />
          </Box>
        </Scrollbar>
      </Drawer>
    </>
  );
}
