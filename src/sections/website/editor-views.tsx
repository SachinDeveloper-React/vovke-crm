import Stack from '@mui/material/Stack';

import { PageHeader } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';

import { DeleteDocumentButton } from './document-forms';
import { EditorShell } from './editor-shell';
import type { SiteDocumentEdit, SiteOverview, SitePageEdit, SiteRevision } from './types';

/**
 * The two editors' server halves: read the page (or document), its history
 * and the website's address, and hand them to `EditorShell`. Keyed on the
 * page alone: a save, a restore or a reset hands the editor the content the
 * API now holds, and a remount on each new revision would also wipe the
 * "Saved — the website shows it now" it has just been told.
 */

async function siteBase(): Promise<string> {
  const site = await adminGet<Pick<SiteOverview, 'siteUrl'>>('/admin/site');
  return site.siteUrl.replace(/\/+$/, '');
}

export async function PageEditorView({ pageKey }: { pageKey: string }) {
  const [page, history, base] = await Promise.all([
    adminGet<SitePageEdit>(`/admin/site/pages/${encodeURIComponent(pageKey)}`),
    adminGet<{ data: SiteRevision[] }>(`/admin/site/pages/${encodeURIComponent(pageKey)}/revisions`),
    siteBase(),
  ]);
  const viewUrl = page.path && !page.path.includes('CODE') ? `${base}${page.path}` : page.path ? null : `${base}/`;

  return (
    <Stack>
      <PageHeader title={`Website · ${page.label}`} subtitle={page.caption} />
      <EditorShell
        key={page.key}
        kind="page"
        id={page.key}
        data={page}
        history={history.data}
        viewUrl={viewUrl}
        canReset
        resetLabel="Back to the shipped copy"
      />
    </Stack>
  );
}

export async function DocumentEditorView({ slug }: { slug: string }) {
  const [doc, history, base] = await Promise.all([
    adminGet<SiteDocumentEdit>(`/admin/site/documents/${encodeURIComponent(slug)}`),
    adminGet<{ data: SiteRevision[] }>(`/admin/site/documents/${encodeURIComponent(slug)}/revisions`),
    siteBase(),
  ]);
  const subtitle = doc.core
    ? `${base}${doc.path} — linked from the app and the store listings, so it is always published.`
    : doc.shipped
      ? `${base}${doc.path} — shipped with the site. Switch “Published” off to take it down.`
      : `${base}${doc.path} — written here.${doc.published ? '' : ' Hidden until you switch “Published” on.'}`;

  return (
    <Stack>
      <PageHeader
        title={`Document · ${doc.title}`}
        subtitle={subtitle}
        action={!doc.shipped ? <DeleteDocumentButton slug={doc.slug} title={doc.title} /> : undefined}
      />
      <EditorShell
        key={doc.slug}
        kind="document"
        id={doc.slug}
        data={doc}
        history={history.data}
        viewUrl={doc.published ? `${base}${doc.path}` : null}
        canReset={doc.shipped}
        resetLabel="Back to the shipped words"
      />
    </Stack>
  );
}
