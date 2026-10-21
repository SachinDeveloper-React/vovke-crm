"use client"
import type { IconButtonProps } from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";

import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import { useBoolean } from "@/src/hooks";
import { varAlpha } from "@/src/theme";
import { Iconify } from "@/src/components/iconify/iconify";
import { Scrollbar } from "@/src/components/scrollbar";
import { AnimateAvatar } from "@/src/components/animate/animate-avatar";

import { AccountButton } from "./account-button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type User = {
    displayName?: string;
    name?: string;
    photoURL?: string;
    extension?: string;
    email?: string;
};

export type AccountDrawerProps = IconButtonProps & {
    user?: User;
    sx?: SxProps<Theme>;
};

const AccountDrawer = ({ user, sx, ...other }: AccountDrawerProps) => {
    const theme = useTheme();
    const drawer = useBoolean();

    const avatarUrl = user?.photoURL;

    return (
        <>
            <AccountButton
                onClick={drawer.onTrue}
                photoURL={avatarUrl}
                displayName={user?.displayName}
                sx={sx}
                {...other}
            />

            <Drawer
                open={drawer.value}
                onClose={drawer.onFalse}
                anchor="right"
                slotProps={{
                    backdrop: { invisible: true },
                    paper: { sx: { width: 320 } },
                }}
            >
                <IconButton
                    onClick={drawer.onFalse}
                    aria-label="Close account drawer"
                    sx={{ top: 12, left: 12, zIndex: 9, position: "absolute" }}
                >
                    <Iconify icon="mingcute:close-line" />
                </IconButton>

              
<Scrollbar>
  <Box
    sx={{
      mx: 2,
      mt: 3,
      mb: 2,
      p: 3,
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
      border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
      background: `linear-gradient(
        145deg,
        ${varAlpha(theme.vars.palette.primary.mainChannel, 0.10)} 0%,
        ${varAlpha(theme.vars.palette.background.defaultChannel, 0.8)} 55%,
        ${varAlpha(theme.vars.palette.info.mainChannel, 0.06)} 100%
      )`,
    }}
  >
    {/* Decorative background */}
    <Box
      sx={{
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: '50%',
        bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.07),
        top: -65,
        right: -45,
        pointerEvents: 'none',
      }}
    />

    <Stack
      spacing={1}
  
      sx={{ alignItems: "center", position: 'relative', zIndex: 1 }}
    >
      {/* Animated avatar */}
      <AnimateAvatar
        width={88}
        slotProps={{
          avatar: {
            src: avatarUrl,
            alt: user?.name ?? 'User avatar',
            sx: {
              fontSize: 30,
              fontWeight: 700,
              bgcolor: 'background.paper',
              color: 'primary.main',
            },
          },
          overlay: {
            border: 2,
            spacing: 3,
            color: `linear-gradient(
              135deg,
              ${theme.vars.palette.primary.main},
              ${theme.vars.palette.info.main},
              ${theme.vars.palette.primary.main}
            )`,
          },
          animate: {
            transition: {
              duration: 8,
            },
          },
        }}
      >
        {user?.name?.charAt(0).toUpperCase()}
      </AnimateAvatar>

      {/* User name */}
      <Box sx={{ maxWidth: '100%', pt: 1 }}>
        <Typography
          variant="subtitle1"
          noWrap
          sx={{
            fontWeight: 700,
            letterSpacing: -0.3,
            maxWidth: 220,
          }}
        >
          {user?.name || 'User'}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            mt: 0.25,
          }}
        >
          CRM Workspace
        </Typography>
      </Box>

      {/* Extension badge */}
      {user?.extension && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.5,
            borderRadius: 99,
            bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.10),
            color: 'primary.main',
            border: `1px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.18)}`,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'success.main',
            }}
          />
          <Typography variant="caption" sx={{fontWeight:"700"}}>
            Extension {user.extension}
          </Typography>
        </Box>
      )}

      {/* Email */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          mt: 1,
          pt: 1.5,
          borderTop: `1px dashed ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
        }}
      >
        <Iconify
          icon="solar:letter-linear"
          width={16}
          sx={{ flexShrink: 0, color: 'text.disabled' }}
        />

        <Typography
          variant="caption"
          noWrap
          title={user?.email}
          sx={{
            color: 'text.secondary',
            maxWidth: '100%',
          }}
        >
          {user?.email || 'No email available'}
        </Typography>
      </Box>
    </Stack>
  </Box>
</Scrollbar>

            </Drawer>
        </>
    );
};

export default AccountDrawer;