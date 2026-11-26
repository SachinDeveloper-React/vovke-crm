'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { adminWrite } from '@/src/lib/api';
import { paths } from '@/src/layout/paths';

import type { EditorData, Enquiry, WebsiteRefresh } from './types';

/**
 * The Website section's writes (RULES P22). Each returns what the form needs
 * to show — never throws — and the API's field-by-field refusal comes back
 * as `fields`, so the editor can mark the box rather than only say so.
 */

export type EditorResult =
  | { ok: true; message: string; data: EditorData & { website?: WebsiteRefresh | null } }
  | { ok: false; message: string; fields: Record<string, string>; conflict: boolean };

const WEBSITE: Record<WebsiteRefresh, string> = {
  done: 'The website shows it now.',
  off: 'The website picks it up within the hour (its refresh hook is not set up on the API).',
  failed: 'The website could not be told straight away, so it picks it up within the hour.',
};

const said = (website: WebsiteRefresh | null | undefined) => (website ? ` ${WEBSITE[website]}` : '');

function fieldsOf(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  return Object.fromEntries(
    Object.entries(details as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

async function editorWrite(
  method: 'PUT' | 'POST' | 'DELETE',
  path: string,
  body: unknown,
  done: string,
  refresh: string[],
): Promise<EditorResult> {
  const result = await adminWrite<EditorData & { website?: WebsiteRefresh | null }>(method, path, body);
  if (!result.ok) {
    return { ok: false, message: result.error, fields: fieldsOf(result.details), conflict: result.code === 'SITE_EDIT_CONFLICT' };
  }
  for (const page of refresh) revalidatePath(page);
  return { ok: true, message: `${done}${said(result.data.website)}`, data: result.data };
}

// ─── Pages ─────────────────────────────────────────────────────────────────

export async function savePage(key: string, content: Record<string, unknown>, revision: number, note: string): Promise<EditorResult> {
  return editorWrite(
    'PUT',
    `/admin/site/pages/${encodeURIComponent(key)}`,
    { content, revision, ...(note.trim() ? { note: note.trim() } : {}) },
    'Saved.',
    [paths.dashboard.website.root],
  );
}

export async function resetPage(key: string, revision: number): Promise<EditorResult> {
  return editorWrite(
    'DELETE',
    `/admin/site/pages/${encodeURIComponent(key)}`,
    { revision, note: 'Back to the shipped copy' },
    'Back to the shipped copy.',
    [paths.dashboard.website.root, paths.dashboard.website.page(key)],
  );
}

export async function restorePage(key: string, id: string, revision: number): Promise<EditorResult> {
  return editorWrite(
    'POST',
    `/admin/site/pages/${encodeURIComponent(key)}/restore`,
    { id, revision },
    'That version is live again.',
    [paths.dashboard.website.root, paths.dashboard.website.page(key)],
  );
}

export async function refreshWebsite(): Promise<{ ok: boolean; message: string }> {
  const result = await adminWrite<{ website: WebsiteRefresh }>('POST', '/admin/site/refresh');
  if (!result.ok) return { ok: false, message: result.error };
  return {
    ok: result.data.website === 'done',
    message:
      result.data.website === 'done'
        ? 'The website is re-reading every page now.'
        : result.data.website === 'off'
          ? 'The refresh hook is not set up on the API (SITE_REVALIDATE_URL and SITE_REVALIDATE_SECRET), so the website catches up within the hour.'
          : 'The website did not answer. It catches up within the hour on its own.',
  };
}

// ─── Documents ─────────────────────────────────────────────────────────────

export async function saveDocument(slug: string, content: Record<string, unknown>, revision: number, note: string): Promise<EditorResult> {
  return editorWrite(
    'PUT',
    `/admin/site/documents/${encodeURIComponent(slug)}`,
    { content, revision, ...(note.trim() ? { note: note.trim() } : {}) },
    'Saved.',
    [paths.dashboard.website.documents],
  );
}

export async function resetDocument(slug: string, revision: number): Promise<EditorResult> {
  return editorWrite(
    'POST',
    `/admin/site/documents/${encodeURIComponent(slug)}/reset`,
    { revision, note: 'Back to the shipped copy' },
    'Back to the shipped copy.',
    [paths.dashboard.website.documents, paths.dashboard.website.document(slug)],
  );
}

export async function restoreDocument(slug: string, id: string, revision: number): Promise<EditorResult> {
  return editorWrite(
    'POST',
    `/admin/site/documents/${encodeURIComponent(slug)}/restore`,
    { id, revision },
    'That version is live again.',
    [paths.dashboard.website.documents, paths.dashboard.website.document(slug)],
  );
}

export type FormState = { ok?: string; error?: string };

/** A new document: created hidden, then opened in the editor. */
export async function createDocument(_previous: FormState, form: FormData): Promise<FormState> {
  const slug = String(form.get('slug') ?? '').trim().toLowerCase();
  const title = String(form.get('title') ?? '').trim();
  const copyFrom = String(form.get('copyFrom') ?? '').trim();
  const result = await adminWrite<{ slug: string }>('POST', '/admin/site/documents', {
    slug,
    title,
    ...(copyFrom ? { copyFrom } : {}),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(paths.dashboard.website.documents);
  redirect(paths.dashboard.website.document(result.data.slug));
}

export async function deleteDocument(_previous: FormState, form: FormData): Promise<FormState> {
  const slug = String(form.get('slug') ?? '');
  const result = await adminWrite<{ deleted: boolean }>('DELETE', `/admin/site/documents/${encodeURIComponent(slug)}`, {
    confirm: String(form.get('confirm') ?? '').trim(),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(paths.dashboard.website.documents);
  redirect(paths.dashboard.website.documents);
}

// ─── Enquiries ─────────────────────────────────────────────────────────────

export async function updateEnquiry(_previous: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');
  const note = form.get('note');
  const result = await adminWrite<Enquiry>('PUT', `/admin/site/enquiries/${encodeURIComponent(id)}`, {
    ...(status ? { status } : {}),
    ...(typeof note === 'string' ? { note: note.trim() || null } : {}),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(paths.dashboard.website.enquiry(id));
  revalidatePath(paths.dashboard.website.enquiries);
  return { ok: 'Saved.' };
}

export async function replyToEnquiry(_previous: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get('id') ?? '');
  const send = form.get('send') === 'email';
  const result = await adminWrite<Enquiry>('POST', `/admin/site/enquiries/${encodeURIComponent(id)}/replies`, {
    message: String(form.get('message') ?? ''),
    send,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(paths.dashboard.website.enquiry(id));
  revalidatePath(paths.dashboard.website.enquiries);
  return { ok: send ? 'Sent by email, and written down here.' : 'Written down. Nothing was emailed.' };
}

export async function deleteEnquiry(_previous: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get('id') ?? '');
  const result = await adminWrite<{ deleted: boolean }>('DELETE', `/admin/site/enquiries/${encodeURIComponent(id)}`);
  if (!result.ok) return { error: result.error };
  revalidatePath(paths.dashboard.website.enquiries);
  redirect(paths.dashboard.website.enquiries);
}
