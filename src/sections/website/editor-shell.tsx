'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { useStaff } from '@/src/components/staff/staff-context';

import { resetDocument, resetPage, restoreDocument, restorePage, saveDocument, savePage, type EditorResult } from './actions';
import { setIn } from './schema';
import { SchemaForm } from './schema-editor';
import type { EditorData, SiteRevision, SiteToken } from './types';

/**
 * A website page or document open for editing (RULES P22): the form, and
 * beside it Save, the tokens the words may use, and the page's history.
 *
 * Nothing is written until Save. The API refuses a save over somebody
 * else's newer one (the revision this was opened at travels with it), and
 * refuses a field the website could not draw — both come back here with the
 * box marked, and nothing typed is lost.
 */
export function EditorShell({
  kind,
  id,
  data,
  history,
  viewUrl,
  canReset,
  resetLabel,
}: {
  kind: 'page' | 'document';
  id: string;
  data: EditorData;
  history: SiteRevision[];
  /** Where it shows on the live site, when it shows anywhere. */
  viewUrl: string | null;
  /** Whether there is a shipped copy to go back to. */
  canReset: boolean;
  resetLabel: string;
}) {
  const router = useRouter();
  const { can, loading } = useStaff();
  const mayEdit = loading || can('website.edit');

  const [content, setContent] = useState(data.content);
  const [revision, setRevision] = useState(data.revision);
  const [saved, setSaved] = useState(data.content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [said, setSaid] = useState<{ ok: boolean; message: string; conflict?: boolean } | null>(null);
  const [busy, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const dirty = content !== saved;

  // Leaving with unsaved words asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const onChange = useCallback((path: string, value: unknown) => {
    setContent(current => setIn(current, path.split('.'), value) as Record<string, unknown>);
    setErrors(current => {
      if (!(path in current)) return current;
      const next = { ...current };
      delete next[path];
      return next;
    });
  }, []);

  const land = (result: EditorResult) => {
    if (result.ok) {
      setContent(result.data.content);
      setSaved(result.data.content);
      setRevision(result.data.revision);
      setErrors({});
      setNote('');
      setSaid({ ok: true, message: result.message });
      router.refresh();
    } else {
      const marked = Object.keys(result.fields).length;
      setErrors(result.fields);
      setSaid({
        ok: false,
        // The reasons sit under the boxes themselves; here, only how many and that nothing went out.
        message:
          marked > 0
            ? `Not saved — ${marked === 1 ? 'one box needs' : `${marked} boxes need`} fixing. ${marked === 1 ? 'It is' : 'They are'} marked in red, and the section holding ${marked === 1 ? 'it' : 'them'} says “to fix”.`
            : result.message,
        conflict: result.conflict,
      });
    }
  };

  const save = () =>
    startTransition(async () => {
      land(kind === 'page' ? await savePage(id, content, revision, note) : await saveDocument(id, content, revision, note));
    });

  const reset = () =>
    startTransition(async () => {
      setConfirmReset(false);
      land(kind === 'page' ? await resetPage(id, revision) : await resetDocument(id, revision));
    });

  const restore = (entry: SiteRevision) =>
    startTransition(async () => {
      land(kind === 'page' ? await restorePage(id, entry.id, revision) : await restoreDocument(id, entry.id, revision));
    });

  const icons = useMemo(() => data.icons, [data.icons]);
  const faqOptions = useMemo(() => data.faqOptions ?? [], [data.faqOptions]);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={2}>
          {data.invalid && (
            <Alert severity="warning">
              The saved copy no longer fits this page’s shape, so the website is showing the shipped copy instead. Fix the fields
              below and save to put yours back. ({data.invalid.split('\n')[0]})
            </Alert>
          )}
          {data.isDefault && revision === 0 && (
            <Alert severity="info" variant="outlined">
              Nobody has edited this yet — it is the copy the site shipped with. Your first save makes it yours.
            </Alert>
          )}
          <SchemaForm
            schema={data.schema}
            value={content}
            icons={icons}
            faqOptions={faqOptions}
            errors={errors}
            disabled={busy || !mayEdit}
            onChange={onChange}
          />
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
          <Card sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">{dirty ? 'Unsaved changes' : 'Saved'}</Typography>
                <Chip size="small" variant="outlined" label={revision === 0 ? 'Shipped copy' : `Revision ${revision}`} />
              </Stack>
              {said && (
                <Alert severity={said.ok ? 'success' : 'error'} variant="outlined">
                  {said.message}
                </Alert>
              )}
              {said?.conflict && (
                <Button size="small" color="warning" variant="outlined" onClick={() => window.location.reload()}>
                  Reload their version (your changes here are lost)
                </Button>
              )}
              {!mayEdit && (
                <Alert severity="info" variant="outlined">
                  You can read this page; changing it needs the “edit website pages” permission.
                </Alert>
              )}
              <TextField
                size="small"
                label="What changed (optional)"
                placeholder="New headline for Diwali"
                value={note}
                onChange={event => setNote(event.target.value)}
                disabled={busy || !mayEdit}
                helperText="Shown in History beside this save."
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={save}
                  loading={busy}
                  disabled={!dirty || !mayEdit}
                  startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
                  sx={{ flex: 1 }}
                >
                  Save and publish
                </Button>
                <Tooltip title="Throw away what you typed since the last save">
                  <span>
                    <Button
                      color="inherit"
                      disabled={!dirty || busy}
                      onClick={() => {
                        setContent(saved);
                        setErrors({});
                        setSaid(null);
                      }}
                    >
                      Discard
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {viewUrl && (
                  <Button
                    size="small"
                    color="inherit"
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<Iconify icon="solar:arrow-right-up-linear" />}
                  >
                    View on the website
                  </Button>
                )}
                {canReset && revision > 0 && (
                  <Button
                    size="small"
                    color="warning"
                    disabled={busy || !mayEdit}
                    onClick={() => setConfirmReset(true)}
                    startIcon={<Iconify icon="solar:restart-bold-duotone" />}
                  >
                    {resetLabel}
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Saving puts it on the website straight away. Every save is kept in History and can be put back.
              </Typography>
            </Stack>
          </Card>

          <TokenCard tokens={data.tokens} />

          <HistoryCard history={history} busy={busy || !mayEdit} current={revision} onRestore={restore} />
        </Stack>
      </Grid>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{resetLabel}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            The website goes back to the words it shipped with. What is there now stays in History, so it can be restored.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button color="warning" variant="contained" onClick={reset}>
            {resetLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

function TokenCard({ tokens }: { tokens: SiteToken[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (name: string) => {
    navigator.clipboard?.writeText(`{{${name}}}`).then(() => setCopied(name), () => {});
  };
  const groups: Array<{ title: string; note: string; source: SiteToken['source'] }> = [
    { title: 'Figures from the app’s config', note: 'Filled in by the server, so the words follow the numbers.', source: 'config' },
    { title: 'Contact details', note: 'From Contact & links. A contact channel whose detail is empty is left out.', source: 'contact' },
  ];
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle1">Tokens</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        Write these instead of a number or an address that lives elsewhere. Click one to copy it. Links: [label](/path) · bold: **words**.
      </Typography>
      <Stack spacing={1.5}>
        {groups.map(group => (
          <Box key={group.source}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              {group.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.75 }}>
              {group.note}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
              {tokens
                .filter(token => token.source === group.source)
                .map(token => (
                  <Tooltip key={token.name} title={token.value === null || token.value === '' ? 'Not set' : `Now: ${token.value}`}>
                    <Chip
                      size="small"
                      variant={copied === token.name ? 'filled' : 'outlined'}
                      color={copied === token.name ? 'success' : 'default'}
                      label={`{{${token.name}}}`}
                      onClick={() => copy(token.name)}
                      sx={{ fontFamily: 'monospace' }}
                    />
                  </Tooltip>
                ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

const ACTIONS: Record<SiteRevision['action'], string> = {
  saved: 'Saved',
  restored: 'Restored',
  reset: 'Back to shipped',
  created: 'Created',
  deleted: 'Deleted',
};

function HistoryCard({
  history,
  busy,
  current,
  onRestore,
}: {
  history: SiteRevision[];
  busy: boolean;
  current: number;
  onRestore: (entry: SiteRevision) => void;
}) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle1">History</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        Every save, newest first. Restore makes that version live again as a new save.
      </Typography>
      {history.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          No saves yet.
        </Typography>
      ) : (
        <Stack spacing={1.25} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
          {history.map(entry => (
            <Stack key={entry.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {ACTIONS[entry.action]} · r{entry.revision}
                  {entry.revision === current ? ' · live' : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {entry.at ? new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} · {entry.savedBy}
                </Typography>
                {entry.note && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {entry.note}
                  </Typography>
                )}
              </Box>
              {entry.revision !== current && entry.action !== 'deleted' && (
                <Button size="small" color="inherit" disabled={busy} onClick={() => onRestore(entry)}>
                  Restore
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}
