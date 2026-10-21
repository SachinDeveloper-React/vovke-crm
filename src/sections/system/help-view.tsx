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
  TextLink,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Faqs, Guide } from '@/src/lib/types';

import { FaqForm, FaqQuickEdit, GuideDelete, GuideForm } from './help-forms';

export type HelpQuery = {
  q: string;
  category: string;
  state: string;
  sort: string;
  limit: number;
  offset: number;
};

/**
 * The help centre's own content (RULES P12).
 *
 * Both collections exist for one stated reason — so support can answer a
 * wave of the same question by writing one row, without waiting for an app
 * release — and this page is that reason made usable. Two things worth
 * knowing:
 *
 *   - **An empty shelf is a dead end.** The help page lists its rows from
 *     ⚙ `support.topics`, and a row that opens a category with no active
 *     article in it is a tile that leads nowhere. Those categories are
 *     named here rather than left to be discovered by a member.
 *   - **The guide is parsed, not just drawn.** A chapter's icon and tint
 *     are validated against the app's own contract on read, so a name it
 *     cannot draw does not make a blank tile — it makes the whole guide
 *     fail to load. Both are dropdowns for that reason.
 */
export async function HelpView({ query }: { query: HelpQuery }) {
  const [faqs, guide] = await Promise.all([
    adminGet<Faqs>('/admin/support/faqs', {
      q: query.q,
      category: query.category || undefined,
      state: query.state || 'any',
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    }),
    adminGet<Guide>('/admin/support/guide'),
  ]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Articles"
            value={number(faqs.totals.articles)}
            icon="solar:book-bookmark-bold-duotone"
            goodDirection="none"
            hint={`${number(faqs.totals.active)} showing`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Empty shelves"
            value={number(faqs.totals.emptyCategories.length)}
            icon="solar:box-minimalistic-bold-duotone"
            goodDirection="down"
            hint={
              faqs.totals.emptyCategories.length > 0
                ? faqs.totals.emptyCategories.join(', ')
                : 'every category has something in it'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Guide chapters"
            value={number(guide.totals.sections)}
            icon="solar:notebook-bold-duotone"
            goodDirection="none"
            hint={`${number(guide.totals.active)} showing · ${number(guide.totals.steps)} steps`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Where the tiles come from"
            value="⚙ support.topics"
            icon="solar:tuning-square-bold-duotone"
            goodDirection="none"
            hint="the help page's own rows are config, not this page"
          />
        </Grid>
      </Grid>

      {faqs.totals.emptyCategories.length > 0 && (
        <Panel title="Shelves with nothing on them" subtitle="A help-page row that opens an empty list">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nothing active is filed under {faqs.totals.emptyCategories.join(', ')}. If ⚙ <Mono>support.topics</Mono>{' '}
            has a row pointing at one of those, a member tapping it gets an empty screen — either write an article for
            it below, or take the row off the help page on the{' '}
            <TextLink href={{ pathname: paths.dashboard.config }}>App config</TextLink> page.
          </Typography>
        </Panel>
      )}

      <Panel
        title="Write an article"
        subtitle="Members read it at once — no release"
        note="The id is what a deep link and our own notes use, so it is fixed once written. Hiding an article keeps it; deleting removes it, and nothing holds a snapshot of one."
      >
        <FaqForm categories={faqs.categories} />
      </Panel>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Question, answer or tag" />
        <SelectFilter
          label="Shelf"
          param="category"
          value={query.category}
          options={[
            { value: '', label: 'Every shelf' },
            ...faqs.categories.map(category => ({ value: category, label: category })),
          ]}
          width={160}
        />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Everything' },
            { value: 'active', label: 'Showing' },
            { value: 'hidden', label: 'Hidden' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'shelf', label: 'Shelf order' },
            { value: 'newest', label: 'Newest' },
            { value: 'question', label: 'By question' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${number(faqs.total)} article${faqs.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'hidden ones included'}
        dense
      >
        <DataTable
          columns={[
            { label: 'Question' },
            { label: 'Shelf' },
            { label: 'Also searchable by' },
            { label: 'Change it', width: 280 },
          ]}
          rows={faqs.data.map(article => ({
            key: article.id,
            tone: article.active ? 'default' : 'danger',
            cells: [
              <Stack key="question" spacing={0.25} sx={{ maxWidth: 420 }}>
                <Typography variant="subtitle2">{article.question}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {article.answer.length > 200 ? `${article.answer.slice(0, 197)}…` : article.answer}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Mono>{article.id}</Mono>
                  {!article.active && (
                    <Label color="error" variant="soft">
                      hidden
                    </Label>
                  )}
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    changed {ago(article.updatedAt)}
                  </Typography>
                </Stack>
              </Stack>,
              <Label key="shelf" color="default" variant="soft">
                {article.category}
              </Label>,
              <Typography key="tags" variant="caption" sx={{ color: 'text.secondary' }}>
                {article.tags.length > 0 ? article.tags.join(', ') : '—'}
              </Typography>,
              <FaqQuickEdit key="edit" article={article} categories={faqs.categories} />,
            ],
          }))}
          empty={query.q || query.category ? 'Nothing matches those filters.' : 'No articles yet.'}
        />
        <OffsetPager total={faqs.total} offset={faqs.offset} limit={faqs.limit} />
      </Panel>

      <Panel
        title="Add a guide chapter"
        subtitle="Steps one per line: a title, then what to do"
        note="The icon and the tint are the names the app can draw. It parses the whole guide against its own contract, so an unknown one would stop the guide loading rather than leaving a gap."
      >
        <GuideForm icons={guide.icons} tints={guide.tints} />
      </Panel>

      <Panel
        title={`${number(guide.totals.sections)} chapter${guide.totals.sections === 1 ? '' : 's'}`}
        subtitle="In the order members read them"
        dense
      >
        <DataTable
          columns={[{ label: 'Chapter' }, { label: 'Steps' }, { label: 'Edit it', width: 300 }, { label: '', width: 240 }]}
          rows={guide.data.map(section => ({
            key: section.id,
            tone: section.active ? 'default' : 'danger',
            cells: [
              <Stack key="chapter" spacing={0.25}>
                <Typography variant="subtitle2">{section.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {section.summary}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Mono>{section.id}</Mono>
                  <Label color="default" variant="soft">
                    {section.icon} · {section.tint}
                  </Label>
                  {!section.active && (
                    <Label color="error" variant="soft">
                      hidden
                    </Label>
                  )}
                </Stack>
              </Stack>,
              <Stack key="steps" spacing={0.5} sx={{ maxWidth: 320 }}>
                {section.steps.map((step, index) => (
                  <Typography key={`${section.id}-${index}`} variant="caption" sx={{ color: 'text.secondary' }}>
                    <strong>{step.title}</strong> — {step.body}
                  </Typography>
                ))}
              </Stack>,
              <GuideForm key="edit" icons={guide.icons} tints={guide.tints} section={section} />,
              <GuideDelete key="delete" id={section.id} />,
            ],
          }))}
          empty="The guide is empty."
        />
      </Panel>
    </Stack>
  );
}
