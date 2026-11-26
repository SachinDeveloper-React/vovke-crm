import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DataTable, LinkButton, Panel, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';

import { RefreshSiteButton } from './refresh-button';
import type { SiteOverview } from './types';

/**
 * The website at a glance (RULES P22): every page, whether anybody has
 * changed it from the copy it shipped with, and when; the documents; the
 * messages waiting; and whether a save reaches the site at once.
 */
export async function WebsiteOverviewView() {
  const site = await adminGet<SiteOverview>('/admin/site');
  const edited = site.pages.filter(page => !page.isDefault).length;
  const published = site.documents.filter(doc => doc.published).length;
  const waiting = site.enquiries.new + site.enquiries.open;
  const base = site.siteUrl.replace(/\/+$/, '');

  return (
    <Stack spacing={3}>
      {site.refresh === 'off' && (
        <Alert severity="warning" variant="outlined">
          The API cannot tell the website to refresh (SITE_REVALIDATE_URL and SITE_REVALIDATE_SECRET are not set on it), so a save
          shows on vokve.com within the hour rather than at once.
        </Alert>
      )}
      {site.pages.some(page => page.invalid) && (
        <Alert severity="error" variant="outlined">
          A saved page no longer fits its shape and the website is showing its shipped copy instead:{' '}
          {site.pages.filter(page => page.invalid).map(page => page.label).join(', ')}. Open it and save to fix.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Pages changed" value={`${edited} of ${site.pages.length}`} icon="solar:global-bold-duotone" goodDirection="none" hint="The rest still say what the site shipped with" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Documents live" value={`${published} of ${site.documents.length}`} icon="solar:document-text-bold-duotone" goodDirection="none" hint="Policies and other text pages" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Messages waiting" value={String(waiting)} icon="solar:inbox-line-bold-duotone" goodDirection="down" hint={`${site.enquiries.new} not opened yet`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Shows on the site"
            value={site.refresh === 'on' ? 'At once' : 'Within the hour'}
            icon="solar:refresh-bold-duotone"
            goodDirection="none"
            hint={site.refresh === 'on' ? 'The API asks the site to re-read after each save' : 'The refresh hook is not set up'}
          />
        </Grid>
      </Grid>

      <Panel
        title="Pages"
        subtitle="Every word on these pages is edited here. Contact details and store links are on Contact & links; the questions are the Help centre’s."
        action={<RefreshSiteButton />}
      >
        <DataTable
          columns={[{ label: 'Page' }, { label: 'On the site' }, { label: 'State' }, { label: 'Last saved' }, { label: '', align: 'right' }]}
          rows={site.pages.map(page => ({
            key: page.key,
            tone: page.invalid ? 'danger' : 'default',
            cells: [
              <Stack key="page" spacing={0.25}>
                <TextLink href={paths.dashboard.website.page(page.key)} variant="subtitle2">
                  {page.label}
                </TextLink>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {page.caption}
                </Typography>
              </Stack>,
              page.path ? (
                page.path.includes('CODE') ? (
                  <Typography key="path" variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {page.path}
                  </Typography>
                ) : (
                  <a key="path" href={`${base}${page.path}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: 14 }}>
                    {page.path}
                  </a>
                )
              ) : (
                <Typography key="path" variant="body2" sx={{ color: 'text.secondary' }}>
                  Every page
                </Typography>
              ),
              page.invalid ? (
                <Chip key="state" size="small" color="error" label="Needs fixing" />
              ) : page.isDefault ? (
                <Chip key="state" size="small" variant="outlined" label="Shipped copy" />
              ) : (
                <Chip key="state" size="small" color="success" variant="outlined" label={`Edited · r${page.revision}`} />
              ),
              <Typography key="saved" variant="body2" sx={{ color: 'text.secondary' }}>
                {page.isDefault ? '—' : `${ago(page.updatedAt)}${page.updatedBy ? ` · ${page.updatedBy}` : ''}`}
              </Typography>,
              <LinkButton key="edit" href={paths.dashboard.website.page(page.key)} size="small" variant="outlined" color="inherit">
                Edit
              </LinkButton>,
            ],
          }))}
        />
      </Panel>

      <Panel
        title="Documents"
        subtitle="Privacy, terms and every other policy, each at its own address."
        action={
          <LinkButton href={paths.dashboard.website.documents} size="small" variant="outlined" color="inherit">
            All documents
          </LinkButton>
        }
      >
        <DataTable
          columns={[{ label: 'Document' }, { label: 'Address' }, { label: 'State' }, { label: 'Version' }, { label: 'Last saved' }]}
          rows={site.documents.map(doc => ({
            key: doc.slug,
            tone: doc.invalid ? 'danger' : 'default',
            cells: [
              <TextLink key="title" href={paths.dashboard.website.document(doc.slug)} variant="subtitle2">
                {doc.title}
              </TextLink>,
              <a key="path" href={`${base}${doc.path}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: 14 }}>
                {doc.path}
              </a>,
              doc.published ? (
                <Chip key="state" size="small" color="success" variant="outlined" label={doc.listed ? 'Live' : 'Live · not listed'} />
              ) : (
                <Chip key="state" size="small" variant="outlined" label="Hidden" />
              ),
              <Typography key="version" variant="body2">
                {doc.version}
              </Typography>,
              <Typography key="saved" variant="body2" sx={{ color: 'text.secondary' }}>
                {doc.isDefault ? 'Shipped copy' : `${ago(doc.updatedAt)}${doc.updatedBy ? ` · ${doc.updatedBy}` : ''}`}
              </Typography>,
            ],
          }))}
        />
      </Panel>
    </Stack>
  );
}
