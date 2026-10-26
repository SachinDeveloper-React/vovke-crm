'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { DialogButton } from '@/src/components/ui/dialog-button';

import { importProducts, type ImportActionState } from './import-actions';

/**
 * The catalogue from a spreadsheet.
 *
 * Two presses on purpose. **Check the sheet** reads the file, maps its
 * columns and asks the API what it *would* do — nothing is written.
 * **Import it** does the same thing for real. The shelf is what every
 * member sees, and a sheet's headers are whatever somebody typed, so seeing
 * "38 rows · 4 new · 33 corrections · 1 line I cannot read" before pressing
 * the second button is the difference between an import and an accident.
 *
 * Rows are matched **by slug** — the ID column, or one made from the name —
 * so the same sheet imported next month corrects the products it created
 * rather than listing each of them twice.
 */
export function ImportProductsForm() {
  const [state, action, pending] = useActionState<ImportActionState, FormData>(importProducts, {});
  const [file, setFile] = useState<string>('');

  const report = state.report;

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      {state.ok && (
        <Alert severity={report?.dryRun ? 'info' : 'success'} variant="outlined">
          {state.ok}
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        A header row, then one product per row. The columns it needs are <b>name</b>, <b>price</b> and <b>category</b>;
        everything else is optional — ID, description, MRP, coin price, subcategory, payment mode, stock, images, badge,
        ribbon, deal, featured, tags, sizes, colours, sort, active. Prices are in <b>rupees</b> (“₹1,299.00” reads as
        1299), the shelf has to exist already, and a row the importer cannot read is skipped by itself with the line
        number and the reason. <b>.xlsx</b> and <b>.csv</b> both work.
      </Typography>

      <Link
        href="/api/example-sheets/products"
        underline="hover"
        sx={{ typography: 'body2', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      >
        <Iconify icon="solar:file-download-bold-duotone" width={18} />
        Download the example sheet
      </Link>

      <TextField
        name="file"
        type="file"
        size="small"
        fullWidth
        required
        disabled={pending}
        onChange={event => setFile((event.target as HTMLInputElement).value)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { accept: '.xlsx,.xlsm,.csv,.tsv,.txt' } }}
        label="The sheet"
        helperText="Up to 10 MB"
      />

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button
          type="submit"
          name="mode"
          value="check"
          variant="outlined"
          color="inherit"
          loading={pending}
          disabled={!file}
          startIcon={<Iconify icon="solar:eye-bold-duotone" />}
        >
          Check the sheet
        </Button>
        <Button
          type="submit"
          name="mode"
          value="import"
          variant="contained"
          loading={pending}
          disabled={!file}
          startIcon={<Iconify icon="solar:upload-bold-duotone" />}
        >
          Import it
        </Button>
      </Stack>

      {report && (
        <Stack spacing={1}>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            <Label color="default" variant="soft">
              {report.file} · {report.sheet}
            </Label>
            <Label color="default" variant="soft">
              {report.rows} row(s)
            </Label>
            <Label color="success" variant="soft">
              {report.created} new
            </Label>
            <Label color="info" variant="soft">
              {report.updated} corrected
            </Label>
            {report.duplicates > 0 && (
              <Label color="warning" variant="soft">
                {report.duplicates} repeated
              </Label>
            )}
            {report.failed.length > 0 && (
              <Label color="error" variant="soft">
                {report.failed.length} skipped
              </Label>
            )}
            {report.dryRun && (
              <Label color="warning" variant="soft">
                nothing written yet
              </Label>
            )}
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Columns found: {report.headers.length > 0 ? report.headers.join(', ') : 'none'}
          </Typography>

          {report.failed.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Line</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Why it was skipped</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.failed.slice(0, 25).map((row, index) => (
                  <TableRow key={`${row.line ?? 'row'}-${index}`}>
                    <TableCell>{row.line ?? '—'}</TableCell>
                    <TableCell>{row.title || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption">{row.reason}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {report.failed.length > 25 && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              …and {report.failed.length - 25} more.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}

export function ImportProductsButton() {
  return (
    <DialogButton
      label="Import a sheet"
      icon="solar:file-download-bold-duotone"
      variant="outlined"
      color="inherit"
      maxWidth="md"
      title="Import the catalogue"
      subtitle="Check it first: the panel will say what would change before anything is written."
    >
      <ImportProductsForm />
    </DialogButton>
  );
}
