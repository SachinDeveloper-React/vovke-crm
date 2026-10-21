'use client';

import { useState, type ReactNode } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

type Common = {
  /** What the dialog is called, and what it is for in a line under that. */
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md';
  disabled?: boolean;
};

/**
 * A button that opens a form in a dialog.
 *
 * The panel's forms live in panels, one write per card, which works while a
 * page has three of them. A shelf has a write per row — rename it, add a
 * subcategory, delete one — and twenty panels is not a page anybody reads.
 * So the row keeps its figures and the write is behind the pencil, where
 * the form is the same `useActionState` form it would have been in a card:
 * the dialog stays open after it submits, because the answer the action
 * returns ("renamed on 12 items") is the part worth reading.
 */
export function DialogButton({
  label,
  icon,
  color = 'inherit',
  variant = 'outlined',
  size = 'small',
  title,
  subtitle,
  children,
  maxWidth = 'sm',
  disabled = false,
}: Common & {
  label: string;
  icon?: string;
  color?: 'inherit' | 'primary' | 'error' | 'warning';
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium';
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size={size}
        color={color}
        variant={variant}
        disabled={disabled}
        onClick={() => setOpen(true)}
        startIcon={icon ? <Iconify icon={icon} /> : undefined}
      >
        {label}
      </Button>
      <Shell open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle} maxWidth={maxWidth}>
        {children}
      </Shell>
    </>
  );
}

/** The same thing as an icon on a table row, where a labelled button would not fit. */
export function DialogIconButton({
  icon,
  tooltip,
  color = 'default',
  title,
  subtitle,
  children,
  maxWidth = 'sm',
  disabled = false,
}: Common & {
  icon: string;
  tooltip: string;
  color?: 'default' | 'primary' | 'error';
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={tooltip}>
        {/* A disabled button swallows the pointer events the tooltip needs, so the span carries them. */}
        <span>
          <IconButton size="small" color={color} disabled={disabled} onClick={() => setOpen(true)}>
            <Iconify icon={icon} />
          </IconButton>
        </span>
      </Tooltip>
      <Shell open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle} maxWidth={maxWidth}>
        {children}
      </Shell>
    </>
  );
}

function Shell({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth,
}: Common & { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle sx={{ pb: subtitle ? 0.5 : 2 }}>
        {title}
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
