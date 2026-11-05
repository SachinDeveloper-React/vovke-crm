'use server';

import { revalidatePath } from 'next/cache';

import { paths } from '@/src/layout/paths';
import { adminWrite } from '@/src/lib/api';
import type { MediaAsset, SignedUpload } from '@/src/lib/types';

export type MediaState = { ok?: string; error?: string };

/**
 * Asks the API where to put one file.
 *
 * The bytes never pass through this panel's server or the API's. The browser
 * is handed a signed URL and puts the file to the bucket itself — which is
 * not an optimisation: the API runs on a platform that refuses a request
 * body over four and a half megabytes, and a four megabyte photo base64'd
 * into one is over that before anybody's code runs.
 */
export async function signUpload(
  kind: string,
  contentType: string,
  filename: string,
): Promise<{ upload?: SignedUpload; error?: string }> {
  const signed = await adminWrite<SignedUpload>('POST', '/admin/media/sign', {
    kind,
    contentType,
    filename,
  });
  return signed.ok ? { upload: signed.data } : { error: signed.error };
}

/**
 * Records what landed, after the browser has put it.
 *
 * Separate from signing because only the bucket knows whether the upload
 * finished: the API asks it, and refuses anything too big or not an image
 * rather than trusting what this panel claims it sent.
 */
export async function confirmUpload(
  key: string,
  kind: string,
  filename: string,
): Promise<{ asset?: MediaAsset; error?: string }> {
  const saved = await adminWrite<MediaAsset>('POST', '/admin/media', { key, kind, filename });
  if (!saved.ok) return { error: saved.error };
  revalidatePath(paths.dashboard.media);
  return { asset: saved.data };
}

/** Refused while a product still shows it — the API says which, and how many. */
export async function removeMedia(_previous: MediaState, form: FormData): Promise<MediaState> {
  const id = String(form.get('id') ?? '').trim();
  if (!id) return { error: 'Nothing to remove.' };

  const removed = await adminWrite<{ deleted: true }>(
    'DELETE',
    `/admin/media/${encodeURIComponent(id)}`,
  );
  if (!removed.ok) return { error: removed.error };

  revalidatePath(paths.dashboard.media);
  return { ok: 'Removed.' };
}
