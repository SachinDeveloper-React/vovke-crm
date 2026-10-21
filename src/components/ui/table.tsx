import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

export type Column = { label: string; align?: 'left' | 'right' | 'center'; width?: number | string };
export type Row = { key: string; cells: ReactNode[]; tone?: 'default' | 'danger' };

/**
 * A table, plain.
 *
 * Deliberately not a data grid: every table here is a server-rendered page of
 * rows the API already sorted and paged, and a grid would ship a few hundred
 * kilobytes of client-side sorting to re-sort what is already in order.
 */
export function DataTable({
  columns,
  rows,
  empty = 'Nothing to show.',
  dense = true,
}: {
  columns: Column[];
  rows: Row[];
  empty?: string;
  dense?: boolean;
}) {
  return (
    // `minWidth: 0` is the one that matters: a flex or grid child defaults to
    // `min-width: auto`, so a 640px table inside it stretched the card instead
    // of scrolling within it — the table looked clipped and would not move.
    // `maxWidth: '100%'` keeps it inside the card once it can shrink.
    <Box
      sx={{
        minWidth: 0,
        maxWidth: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        // A hairline where the table is wider than its card, so it is visible
        // that there is more to the right.
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': { borderRadius: 4, bgcolor: 'var(--mui-palette-action-disabled)' },
      }}
    >
      <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column.label}
                align={column.align ?? 'left'}
                sx={{ width: column.width, whiteSpace: 'nowrap' }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography variant="body2" sx={{ color: 'text.disabled', py: 2, textAlign: 'center' }}>
                  {empty}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map(row => (
            <TableRow
              key={row.key}
              hover
              sx={
                row.tone === 'danger'
                  ? { bgcolor: 'color-mix(in srgb, var(--mui-palette-error-main) 8%, transparent)' }
                  : undefined
              }
            >
              {row.cells.map((cell, index) => (
                <TableCell
                  key={`${row.key}-${index}`}
                  align={columns[index]?.align ?? 'left'}
                  sx={{ verticalAlign: 'top' }}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
