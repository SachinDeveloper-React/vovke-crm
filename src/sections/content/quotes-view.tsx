import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  Mono,
  OffsetPager,
  Panel,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import type { Tips } from '@/src/lib/types';

import { BulkTipsForm, TipForm, TipQuickEdit } from './quote-forms';

export type QuotesQuery = {
  q: string;
  topic: string;
  state: string;
  sort: string;
  limit: number;
  offset: number;
};

/**
 * Where each line is drawn, in the words somebody who has used the app
 * would recognise. A topic is a card on a screen, not a label.
 */
const WHERE: Record<string, string> = {
  motivation: 'Home — the day’s quote card',
  hydration: 'Water screen — the tip under the log',
  reminders: 'Reminder plan — the note at the foot',
  nutrition: 'Nutrition screen — the tip card',
  health: 'Health checkup — the tip card',
  heart_rate: 'Heart rate — the advice card',
  blood_pressure: 'Blood pressure — the advice card',
};

/**
 * The lines the app says in its own voice (BACKEND §6.15).
 *
 * Two things make this a page rather than a list of rows:
 *
 *   - **One line per screen per day.** The rotation is a function of the
 *     day and the number of live lines, so "which quote is on the home
 *     screen right now" is a question only the server can answer — and it
 *     is the first one anybody asks. Today's line is marked on its row and
 *     named per screen in the panel at the top.
 *   - **A screen with nothing live draws no card at all.** That is correct
 *     behaviour and invisible from here unless it is said, so the silent
 *     screens are counted and named.
 *
 * Deleting is a real delete: nothing holds a snapshot of a tip. Hiding one
 * keeps it and takes it out of the rotation, which is what a line being
 * drafted or withdrawn for a fortnight wants.
 */
export async function QuotesView({ query }: { query: QuotesQuery }) {
  const tips = await adminGet<Tips>('/admin/tips', {
    q: query.q,
    topic: query.topic || undefined,
    state: query.state || 'any',
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });

  const today = new Map(tips.byTopic.map(row => [row.topic, row]));
  const textOf = (id: string | null) => tips.data.find(row => row.id === id)?.text ?? null;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Lines"
            value={number(tips.totals.lines)}
            icon="solar:quote-up-square-bold-duotone"
            goodDirection="none"
            hint={`${number(tips.totals.active)} in rotation`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Silent screens"
            value={number(tips.totals.silentTopics.length)}
            icon="solar:box-minimalistic-bold-duotone"
            goodDirection="down"
            hint={
              tips.totals.silentTopics.length > 0
                ? tips.totals.silentTopics.join(', ')
                : 'every screen has a line today'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Screens"
            value={number(tips.topics.length)}
            icon="solar:smartphone-bold-duotone"
            goodDirection="none"
            hint="each one is a card built for it"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Changes reach the app"
            value="Same day"
            icon="solar:refresh-bold-duotone"
            goodDirection="none"
            hint="no release — the app reads a line a day"
          />
        </Grid>
      </Grid>

      <Panel
        title="What each screen is saying today"
        subtitle="One line per screen per day, in order, round the lines that are in rotation"
        note="A screen with nothing in rotation draws no card at all — which is correct, and worth knowing about."
        dense
      >
        <DataTable
          columns={[{ label: 'Screen' }, { label: 'Today' }, { label: 'Lines', width: 160 }]}
          rows={tips.topics.map(topic => {
            const row = today.get(topic);
            const text = textOf(row?.todayId ?? null);
            return {
              key: topic,
              tone: row && row.active > 0 ? 'default' : 'danger',
              cells: [
                <Stack key="where" spacing={0.25}>
                  <Typography variant="subtitle2">{WHERE[topic] ?? topic}</Typography>
                  <Mono>{topic}</Mono>
                </Stack>,
                <Stack key="today" spacing={0.25} sx={{ maxWidth: 520 }}>
                  {row?.todayId ? (
                    <>
                      <Typography variant="body2">{text ?? '—'}</Typography>
                      <Mono>{row.todayId}</Mono>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                      Nothing in rotation — this screen draws no card.
                    </Typography>
                  )}
                </Stack>,
                <Stack key="count" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color="default" variant="soft">
                    {number(row?.lines ?? 0)} written
                  </Label>
                  <Label color={row && row.active > 0 ? 'success' : 'error'} variant="soft">
                    {number(row?.active ?? 0)} showing
                  </Label>
                </Stack>,
              ],
            };
          })}
          empty="No lines yet."
        />
      </Panel>

      <Panel
        title="Write a line"
        subtitle="Members read it on the day it comes up — no release"
        note="The id is fixed once written, and the order decides where the line falls in the rotation. A heading is only drawn by the reminder and vital cards."
      >
        <TipForm topics={tips.topics} />
      </Panel>

      <Panel
        title="Paste a list"
        subtitle="One quote per line, added to the end of that screen's rotation"
        note="A line the screen already holds word for word is skipped, so pasting the same list twice changes nothing."
      >
        <BulkTipsForm topics={tips.topics} />
      </Panel>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="A word in the line, its heading or its id" />
        <SelectFilter
          label="Screen"
          param="topic"
          value={query.topic}
          options={[
            { value: '', label: 'Every screen' },
            ...tips.topics.map(topic => ({ value: topic, label: topic })),
          ]}
          width={180}
        />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Everything' },
            { value: 'active', label: 'In rotation' },
            { value: 'hidden', label: 'Hidden' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'rotation', label: 'Rotation order' },
            { value: 'newest', label: 'Newest' },
            { value: 'text', label: 'By line' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[50, 100, 200].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${number(tips.total)} line${tips.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'hidden ones included'}
        dense
      >
        <DataTable
          columns={[{ label: 'The line' }, { label: 'Screen' }, { label: 'Change it', width: 250 }]}
          rows={tips.data.map(tip => ({
            key: tip.id,
            tone: tip.active ? 'default' : 'danger',
            cells: [
              <Stack key="line" spacing={0.25} sx={{ maxWidth: 520 }}>
                {tip.title && <Typography variant="subtitle2">{tip.title}</Typography>}
                <Typography variant="body2">{tip.text}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Mono>{tip.id}</Mono>
                  {tip.showingToday && (
                    <Label color="success" variant="soft">
                      showing today
                    </Label>
                  )}
                  {!tip.active && (
                    <Label color="error" variant="soft">
                      hidden
                    </Label>
                  )}
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    #{tip.sort} · changed {ago(tip.updatedAt)}
                  </Typography>
                </Stack>
                <TipForm topics={tips.topics} tip={tip} />
              </Stack>,
              <Stack key="where" spacing={0.25}>
                <Typography variant="caption">{WHERE[tip.topic] ?? tip.topic}</Typography>
                <Mono>{tip.topic}</Mono>
              </Stack>,
              <TipQuickEdit key="edit" tip={tip} />,
            ],
          }))}
          empty={query.q || query.topic ? 'Nothing matches those filters.' : 'No lines yet.'}
        />
        <OffsetPager total={tips.total} offset={tips.offset} limit={tips.limit} />
      </Panel>
    </Stack>
  );
}
