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
import type { ReferralCards } from '@/src/lib/types';

import { ReferralCardForm, ReferralCardQuickEdit } from './referral-card-forms';

export type ReferralCardsQuery = {
  q: string;
  screen: string;
  state: string;
  sort: string;
  limit: number;
  offset: number;
};

/**
 * Where each card is drawn, in the words somebody who has used the app would
 * recognise. A screen is a spot in a built screen, not a label.
 */
const WHERE: Record<string, string> = {
  home: 'Home — under the day’s quote',
  wallet: 'Wallet — under the ledger',
  shop: 'Shop — at the foot of the shelves',
  challenges: 'Challenges — under the board',
  nutrition: 'Nutrition — under the diary',
  health: 'Health checkup — under the tip',
  hydration: 'Water — under the log',
  streak: 'Streak — under the calendar',
  analytics: 'Steps analytics — at the foot',
  account: 'Account — under the menu',
};

/**
 * The invite card the app draws around the place (BACKEND §6.15).
 *
 * Three things make this a page rather than a list of rows:
 *
 *   - **One card per screen per day.** Where a screen has several live
 *     cards they rotate a day at a time in order, so "what is on the wallet
 *     right now" is a question only the server can answer — and it is the
 *     first one anybody asks. Today's card is marked on its row and named
 *     per screen in the panel at the top.
 *   - **A screen with nothing live draws no card at all.** That is how the
 *     invite is turned off in one place, correct behaviour, and invisible
 *     from here unless it is said — so the silent screens are counted.
 *   - **The reward is not editable.** `{coins}` and `{friendCoins}` in the
 *     words are filled by the server from what it is actually paying per
 *     referral. A typed-in figure would keep being right only until
 *     somebody changed the economy, and the card is a promise.
 *
 * Deleting is a real delete: nothing holds a snapshot of a card. Hiding one
 * keeps it and takes it out of the rotation, which is what a campaign being
 * drafted or one that has been pulled wants.
 */
export async function ReferralCardsView({ query }: { query: ReferralCardsQuery }) {
  const cards = await adminGet<ReferralCards>('/admin/referral-cards', {
    q: query.q,
    screen: query.screen || undefined,
    state: query.state || 'any',
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });

  const today = new Map(cards.byScreen.map(row => [row.screen, row]));
  const titleOf = (id: string | null) => cards.data.find(row => row.id === id)?.title ?? null;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Cards"
            value={number(cards.totals.cards)}
            icon="solar:gift-bold-duotone"
            goodDirection="none"
            hint={`${number(cards.totals.active)} live`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Screens with no card"
            value={number(cards.totals.silentScreens.length)}
            icon="solar:box-minimalistic-bold-duotone"
            goodDirection="down"
            hint={
              cards.totals.silentScreens.length > 0
                ? cards.totals.silentScreens.join(', ')
                : 'every screen is inviting today'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Screens"
            value={number(cards.screens.length)}
            icon="solar:smartphone-bold-duotone"
            goodDirection="none"
            hint="each one is a spot built for it"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Changes reach the app"
            value="Same day"
            icon="solar:refresh-bold-duotone"
            goodDirection="none"
            hint="no release — the app reads a card a day"
          />
        </Grid>
      </Grid>

      <Panel
        title="What each screen is inviting with today"
        subtitle="One card per screen per day, in order, round the cards that are live"
        note="A screen with nothing live draws no card at all — which is how the invite is switched off in one place, and worth knowing about."
        dense
      >
        <DataTable
          columns={[{ label: 'Screen' }, { label: 'Today' }, { label: 'Cards', width: 160 }]}
          rows={cards.screens.map(screen => {
            const row = today.get(screen);
            const title = titleOf(row?.todayId ?? null);
            return {
              key: screen,
              tone: row && row.active > 0 ? 'default' : 'danger',
              cells: [
                <Stack key="where" spacing={0.25}>
                  <Typography variant="subtitle2">{WHERE[screen] ?? screen}</Typography>
                  <Mono>{screen}</Mono>
                </Stack>,
                <Stack key="today" spacing={0.25} sx={{ maxWidth: 520 }}>
                  {row?.todayId ? (
                    <>
                      <Typography variant="body2">{title ?? '—'}</Typography>
                      <Mono>{row.todayId}</Mono>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                      Nothing live — this screen draws no card.
                    </Typography>
                  )}
                </Stack>,
                <Stack key="count" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color="default" variant="soft">
                    {number(row?.cards ?? 0)} written
                  </Label>
                  <Label color={row && row.active > 0 ? 'success' : 'error'} variant="soft">
                    {number(row?.active ?? 0)} live
                  </Label>
                </Stack>,
              ],
            };
          })}
          empty="No cards yet."
        />
      </Panel>

      <Panel
        title="Write a card"
        subtitle="Members see it the day it comes up — no release"
        note="The id and the screen are fixed once written; where on the screen it sits is not, so move it whenever it reads better higher up. Put {coins} in the words and the server fills in what it is paying."
      >
        <ReferralCardForm
          screens={cards.screens}
          accents={cards.accents}
          positions={cards.positions}
        />
      </Panel>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="A word in the heading, the pitch or the id" />
        <SelectFilter
          label="Screen"
          param="screen"
          value={query.screen}
          options={[
            { value: '', label: 'Every screen' },
            ...cards.screens.map(screen => ({ value: screen, label: screen })),
          ]}
          width={180}
        />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Everything' },
            { value: 'active', label: 'Live' },
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
            { value: 'title', label: 'By heading' },
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
        title={`${number(cards.total)} card${cards.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'hidden ones included'}
        dense
      >
        <DataTable
          columns={[{ label: 'The card' }, { label: 'Screen' }, { label: 'Change it', width: 250 }]}
          rows={cards.data.map(card => ({
            key: card.id,
            tone: card.active ? 'default' : 'danger',
            cells: [
              <Stack key="card" spacing={0.25} sx={{ maxWidth: 520 }}>
                <Typography variant="subtitle2">
                  {card.emoji} {card.title}
                </Typography>
                <Typography variant="body2">{card.message}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Mono>{card.id}</Mono>
                  <Label color="default" variant="soft">
                    {card.ctaLabel}
                  </Label>
                  <Label color="info" variant="soft">
                    {card.accent}
                  </Label>
                  <Label color="warning" variant="soft">
                    {card.position} of screen
                  </Label>
                  {card.showingToday && (
                    <Label color="success" variant="soft">
                      showing today
                    </Label>
                  )}
                  {!card.active && (
                    <Label color="error" variant="soft">
                      hidden
                    </Label>
                  )}
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    #{card.sort} · changed {ago(card.updatedAt)}
                  </Typography>
                </Stack>
                <ReferralCardForm
                  screens={cards.screens}
                  accents={cards.accents}
                  positions={cards.positions}
                  card={card}
                />
              </Stack>,
              <Stack key="where" spacing={0.25}>
                <Typography variant="caption">{WHERE[card.screen] ?? card.screen}</Typography>
                <Mono>{card.screen}</Mono>
              </Stack>,
              <ReferralCardQuickEdit key="edit" card={card} />,
            ],
          }))}
          empty={query.q || query.screen ? 'Nothing matches those filters.' : 'No cards yet.'}
        />
        <OffsetPager total={cards.total} offset={cards.offset} limit={cards.limit} />
      </Panel>
    </Stack>
  );
}
