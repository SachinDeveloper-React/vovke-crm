import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DataTable, LinkButton, Panel, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, date } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';

import { CreateDocumentForm } from './document-forms';
import type { SiteDocumentRow, SiteOverview } from './types';

/**
 * Every document the website serves at its own address (RULES P22): the
 * five it shipped with — privacy and terms always live — and any written
 * here since. A new one is created hidden.
 */
export async function DocumentsView() {
  const [list, site] = await Promise.all([
    adminGet<{ data: SiteDocumentRow[]; reserved: string[] }>('/admin/site/documents'),
    adminGet<Pick<SiteOverview, 'siteUrl'>>('/admin/site'),
  ]);
  const base = site.siteUrl.replace(/\/+$/, '');

  return (
    <Stack spacing={3}>
      <Panel title="Documents" subtitle="Click one to edit its text, its version and dates, and how the legal hub lists it.">
        <DataTable
          columns={[
            { label: 'Document' },
            { label: 'Address' },
            { label: 'State' },
            { label: 'Version' },
            { label: 'Readers see “updated”' },
            { label: 'Last saved' },
            { label: '', align: 'right' },
          ]}
          rows={list.data.map(doc => ({
            key: doc.slug,
            tone: doc.invalid ? 'danger' : 'default',
            cells: [
              <Stack key="title" spacing={0.25}>
                <TextLink href={paths.dashboard.website.document(doc.slug)} variant="subtitle2">
                  {doc.title}
                </TextLink>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {doc.core ? 'Required — always live' : doc.shipped ? 'Shipped with the site' : 'Written here'}
                </Typography>
              </Stack>,
              <a key="path" href={`${base}${doc.path}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: 14 }}>
                {doc.path}
              </a>,
              doc.invalid ? (
                <Chip key="state" size="small" color="error" label="Needs fixing" />
              ) : doc.published ? (
                <Chip key="state" size="small" color="success" variant="outlined" label={doc.listed ? 'Live' : 'Live · not on the hub'} />
              ) : (
                <Chip key="state" size="small" variant="outlined" label="Hidden" />
              ),
              <Typography key="version" variant="body2">
                {doc.version}
              </Typography>,
              <Typography key="shown" variant="body2">
                {date(doc.shownUpdatedAt)}
              </Typography>,
              <Typography key="saved" variant="body2" sx={{ color: 'text.secondary' }}>
                {doc.isDefault ? 'Shipped copy' : `${ago(doc.updatedAt)}${doc.updatedBy ? ` · ${doc.updatedBy}` : ''}`}
              </Typography>,
              <LinkButton key="edit" href={paths.dashboard.website.document(doc.slug)} size="small" variant="outlined" color="inherit">
                Edit
              </LinkButton>,
            ],
          }))}
        />
      </Panel>

      <Panel
        title="A new document"
        subtitle={`A cookie policy, community guidelines, a press page — any text page, at its own address on ${base.replace(/^https?:\/\//, '')}. Addresses the site already uses (${list.reserved.slice(0, 6).join(', ')}…) are refused.`}
      >
        <CreateDocumentForm documents={list.data.map(doc => ({ slug: doc.slug, title: doc.title }))} siteUrl={base} />
      </Panel>
    </Stack>
  );
}
