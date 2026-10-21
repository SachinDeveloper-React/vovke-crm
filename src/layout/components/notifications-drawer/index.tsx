import { m } from "framer-motion";
import type { IconButtonProps } from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

import { useBoolean } from "@/src/hooks";
import { varHover } from "@/src/components/animate/variants/actions";

type Notification = {
  id: string;
  title: string;
  description?: string;
  isUnread?: boolean;
};

type Props = IconButtonProps & {
  data?: Notification[];
  sx?: SxProps<Theme>;
};

export const NotificationsDrawer = ({ data = [], sx, ...other }: Props) => {
  const drawer = useBoolean();
  const notificationCount = data.filter((n) => n.isUnread).length;

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={notificationCount} color="error">
          <SvgIcon>
            {/* https://icon-sets.iconify.design/solar/bell-bing-bold-duotone/ */}
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 1, maxWidth: 420 } },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Notifications
          </Typography>
          <IconButton onClick={drawer.onFalse} aria-label="Close notifications">
            ✕
          </IconButton>
        </Box>

        <Divider />

        {data.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            You're all caught up
          </Box>
        ) : (
          <List disablePadding>
            {data.map((n) => (
              <ListItemButton key={n.id} selected={n.isUnread}>
                <ListItemText primary={n.title} secondary={n.description} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Drawer>
    </>
  );
};