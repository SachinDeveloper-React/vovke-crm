import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  Mono,
  Panel,
  SearchFilter,
  SelectFilter,
  Stat,
  TextLink,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { AppConfigView as AppConfig } from '@/src/lib/types';

import { ConfigKeyRow, type ConfigKind } from './config-forms';

export type ConfigQuery = {
  q: string;
  section: string;
};

/** `{ a: { b: 1 } }` → `{ 'a.b': 1 }`. Arrays are values, not branches — as on the API. */
function flatten(value: unknown, prefix = ''): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return { [prefix]: value };
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
  }
  return out;
}

/** Which box a key gets, from the value it holds. */
function kindOf(value: unknown, shipped: unknown): ConfigKind {
  const sample = value === null || value === undefined ? shipped : value;
  if (typeof sample === 'boolean') return 'boolean';
  if (typeof sample === 'number') return 'number';
  if (sample !== null && typeof sample === 'object') return 'json';
  return 'string';
}

const at = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Record<string, unknown>)[key];
  }, source);

/**
 * Every other knob in the config, section by section.
 *
 * The step pipeline's own twenty-odd knobs have a curated page of their own,
 * grouped and labelled. This is the rest of the file — commerce, hydration,
 * the streak, the health ranges, nutrition, the leaderboard, challenges,
 * OTP, devices, integrity, the account's grace periods, the help centre's
 * copy and the locale — and it is deliberately plainer: one row per key, its
 * path, what it holds and what the code ships.
 *
 * Three things make that safe rather than reckless, and all three are the
 * API's:
 *
 *   - a path that does not exist is **refused**, so a typo cannot write a
 *     key nothing reads;
 *   - a value of the wrong kind is refused against the *shape of the
 *     defaults*, which cannot drift from them because it is them;
 *   - the whole merged config goes through the same cross-field validator
 *     every read runs — before anything is stored, because `validate()`
 *     runs on read and a bad document would otherwise fail every request in
 *     the process rather than the write that caused it.
 *
 * Resetting is `$unset`, so a key goes back to what the code ships rather
 * than to whatever it was before.
 */
export async function ConfigView({ query }: { query: ConfigQuery }) {
  const config = await adminGet<AppConfig>('/admin/config');
  const { sections, totals, nullable } = config;

  const chosen = sections.find(section => section.section === query.section);
  const search = query.q.trim().toLowerCase();

  const rowsFor = (section: typeof sections[number]) => {
    const effective = flatten(section.effective);
    return Object.keys(effective)
      .filter(path => path !== '')
      .map(path => {
        const full = `${section.section}.${path}`;
        return {
          path: full,
          value: effective[path],
          shipped: at(section.defaults, path),
        };
      })
      .filter(row => (search ? row.path.toLowerCase().includes(search) : true))
      .filter(row => !section.managedElsewhere.some(owner => row.path === owner.prefix || row.path.startsWith(`${owner.prefix}.`)));
  };

  const keyTable = (section: typeof sections[number]) => {
    const rows = rowsFor(section);
    return (
      <DataTable
        columns={[{ label: 'Key' }, { label: 'In force', width: 420 }]}
        rows={rows.map(row => ({
          key: row.path,
          tone: JSON.stringify(row.value) !== JSON.stringify(row.shipped) ? 'danger' : 'default',
          cells: [
            <Stack key="key" spacing={0.25} sx={{ maxWidth: 320 }}>
              <Mono>{row.path}</Mono>
              {nullable.includes(row.path) && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  may be empty
                </Typography>
              )}
            </Stack>,
            <ConfigKeyRow
              key="value"
              path={row.path}
              value={row.value}
              shipped={row.shipped}
              kind={kindOf(row.value, row.shipped)}
              nullable={nullable.includes(row.path)}
            />,
          ],
        }))}
        empty={search ? 'No key in this section matches that.' : 'Nothing editable here.'}
      />
    );
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sections"
            value={number(totals.sections)}
            icon="solar:tuning-square-bold-duotone"
            goodDirection="none"
            hint="every section of the config file"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Keys changed"
            value={number(totals.overrides)}
            icon="solar:pen-new-square-bold-duotone"
            goodDirection="none"
            hint={`across ${number(totals.changed)} section(s)`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Checked before it is written"
            value="yes"
            icon="solar:shield-check-bold-duotone"
            goodDirection="none"
            hint="unknown path, wrong kind, and the cross-field rules"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Step knobs"
            value="their own page"
            icon="solar:settings-bold-duotone"
            goodDirection="none"
            hint="grouped and labelled on Steps config"
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="A key, or part of one" />
        <SelectFilter
          label="Section"
          param="section"
          value={query.section}
          options={[
            { value: '', label: 'What has been changed' },
            ...sections.map(section => ({
              value: section.section,
              label: `${section.section}${section.overrides.length > 0 ? ` (${section.overrides.length})` : ''}`,
            })),
          ]}
          width={230}
        />
      </FilterBar>

      {chosen ? (
        <Panel
          title={chosen.section}
          subtitle={
            chosen.overrides.length > 0
              ? `${number(chosen.overrides.length)} key(s) differ from the code · last changed ${ago(chosen.updatedAt)}${chosen.updatedBy ? ` by ${chosen.updatedBy}` : ''}`
              : 'everything here is as the code ships it'
          }
          note="A row in red is a key whose stored value has parted from the code's. “Default” is $unset — it puts the key back to what the code ships, not to whatever it was before."
          action={
            chosen.alsoOnStepsPage ? (
              <TextLink href={{ pathname: paths.dashboard.steps }}>Also on Steps config</TextLink>
            ) : undefined
          }
          dense
        >
          {chosen.managedElsewhere.length > 0 && (
            <Stack sx={{ px: 3, pb: 2 }}>
              {chosen.managedElsewhere.map(owner => (
                <Typography key={owner.prefix} variant="caption" sx={{ color: 'text.secondary' }}>
                  <Mono>{owner.prefix}</Mono> is the {owner.by} page’s — {owner.why}. It is not editable here.
                </Typography>
              ))}
            </Stack>
          )}
          {keyTable(chosen)}
        </Panel>
      ) : (
        <>
          <Panel
            title={`${number(totals.overrides)} key${totals.overrides === 1 ? '' : 's'} changed`}
            subtitle="Where the stored value has parted from the code's"
            note="A fresh database gets a copy of every section from the seed, and a copy is not an override — only a parting is shown, which also catches a default the code has since changed and an old seed pinned."
            dense
          >
            <DataTable
              columns={[{ label: 'Key' }, { label: 'In force', width: 420 }]}
              rows={sections.flatMap(section =>
                section.overrides
                  .filter(row => (search ? row.path.toLowerCase().includes(search) : true))
                  .map(row => ({
                    key: row.path,
                    tone: 'danger' as const,
                    cells: [
                      <Stack key="key" spacing={0.25}>
                        <Mono>{row.path}</Mono>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          changed {ago(section.updatedAt)}
                          {section.updatedBy ? ` by ${section.updatedBy}` : ''}
                        </Typography>
                      </Stack>,
                      <ConfigKeyRow
                        key="value"
                        path={row.path}
                        value={row.value}
                        shipped={row.default}
                        kind={kindOf(row.value, row.default)}
                        nullable={nullable.includes(row.path)}
                      />,
                    ],
                  })),
              )}
              empty={search ? 'Nothing changed matches that.' : 'Nothing has been changed: the server is running on the code’s own defaults.'}
            />
          </Panel>

          <Panel title="The sections" subtitle="Pick one to see every key in it" dense>
            <DataTable
              columns={[
                { label: 'Section' },
                { label: 'Keys', align: 'right' },
                { label: 'Changed', align: 'right' },
                { label: 'Last write' },
              ]}
              rows={sections.map(section => ({
                key: section.section,
                cells: [
                  <Stack key="section" spacing={0.25}>
                    <TextLink
                      href={{ pathname: paths.dashboard.config, query: { section: section.section } }}
                      variant="subtitle2"
                    >
                      {section.section}
                    </TextLink>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {section.alsoOnStepsPage && (
                        <Label color="info" variant="soft">
                          also on Steps config
                        </Label>
                      )}
                      {section.managedElsewhere.map(owner => (
                        <Label key={owner.prefix} color="warning" variant="soft">
                          {owner.prefix} → {owner.by}
                        </Label>
                      ))}
                    </Stack>
                  </Stack>,
                  <Typography key="keys" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(Object.keys(flatten(section.effective)).filter(path => path !== '').length)}
                  </Typography>,
                  <Typography
                    key="changed"
                    variant="body2"
                    sx={{ textAlign: 'right', color: section.overrides.length > 0 ? 'warning.main' : 'text.disabled' }}
                  >
                    {section.overrides.length > 0 ? number(section.overrides.length) : '—'}
                  </Typography>,
                  <Typography key="when" variant="caption" sx={{ color: 'text.secondary' }}>
                    {section.updatedAt ? `${ago(section.updatedAt)}${section.updatedBy ? ` · ${section.updatedBy}` : ''}` : 'never written'}
                  </Typography>,
                ],
              }))}
              empty="No config sections."
            />
          </Panel>
        </>
      )}

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Every write here is one <Mono>$set</Mono> on a dotted path, so two operators turning two knobs do not
        overwrite each other, and the cache is invalidated at once — a member’s next request reads the new value. A
        list or an object is typed as JSON, because there is no honest single-line form for one.
      </Typography>
    </Stack>
  );
}
