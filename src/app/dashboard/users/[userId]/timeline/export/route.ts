import { adminGet, ApiError } from '@/src/lib/api';
import type { StepsTimeline } from '@/src/lib/types';

/**
 * The day as a spreadsheet.
 *
 * The screen above is for reading; this is for checking — opening a day in
 * Excel beside a member's screenshot and filtering it by hand, which is what
 * the owner asked for the list for in the first place. One row per minute,
 * the wall clock split into its own columns, and a column per phone carrying
 * what that phone claimed for the minute, so "who was counting at 14:32" is
 * a glance across rather than a JSON dig.
 *
 * The same read the page makes, with the same filter, so an exported file and
 * the screen it came from can never disagree.
 */

/** A CSV field: quoted always, because a phone's name may hold a comma. */
function field(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const asked = new URL(request.url);
  const date = asked.searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response('A day is needed, as ?date=YYYY-MM-DD.', { status: 400 });
  }
  const overlapsOnly = asked.searchParams.get('overlaps') === 'only';

  let timeline: StepsTimeline;
  try {
    timeline = await adminGet<StepsTimeline>(`/admin/users/${encodeURIComponent(userId)}/steps/timeline`, {
      date,
      overlapsOnly,
    });
  } catch (cause) {
    const error = cause instanceof ApiError ? cause : null;
    return new Response(error ? `${error.code}: ${error.message}` : 'That day could not be read.', {
      status: error?.status ?? 500,
    });
  }

  // A column per phone, in the order the day lists them, so the header is
  // stable across days of the same member.
  const phones = timeline.devices;
  const header = [
    'local_time',
    'year',
    'month',
    'day',
    'weekday',
    'hour',
    'minute',
    'second',
    'epoch_ms',
    'steps_counted',
    'steps_dropped',
    'picked_device',
    'picked_phone',
    'overlap',
    ...phones.map(phone => `claim_${phone.name.replace(/[^A-Za-z0-9]+/g, '_')}`),
  ];

  const lines = [header.map(field).join(',')];
  for (const row of timeline.rows) {
    const claimed = new Map(row.claims.map(claim => [claim.deviceId, claim.steps]));
    lines.push(
      [
        row.at,
        row.parts.year,
        row.parts.month,
        row.parts.day,
        row.parts.weekday,
        row.parts.hour,
        row.parts.minute,
        row.parts.second,
        row.epochMs,
        row.steps,
        row.rejectedSteps,
        row.pickedDeviceId,
        phones.find(phone => phone.deviceId === row.pickedDeviceId)?.name ?? '',
        row.overlap ? 'yes' : 'no',
        ...phones.map(phone => claimed.get(phone.deviceId) ?? ''),
      ]
        .map(field)
        .join(','),
    );
  }

  // A BOM, so Excel opens a UTF-8 file as UTF-8 rather than guessing.
  const body = `﻿${lines.join('\r\n')}\r\n`;
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="vokve-${userId}-${date}${overlapsOnly ? '-overlaps' : ''}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
