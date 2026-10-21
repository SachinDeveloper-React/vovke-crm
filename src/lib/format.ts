/**
 * How a figure is written on screen.
 *
 * Shared by the server pages and the chart components, so a number in a
 * tooltip reads the same as the one in the table above it.
 */

const COMPACT = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const PLAIN = new Intl.NumberFormat('en-IN');

/** 1,284 up to 999; 12.9K, 4.2M past that — stat tiles and axis ticks. */
export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Math.abs(value) < 1000 ? PLAIN.format(value) : COMPACT.format(value);
}

/** Every digit, grouped — table cells, where the exact number is the point. */
export function number(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return PLAIN.format(value);
}

export function decimal(value: number | null | undefined, places = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: places });
}

/** 0.653 → "65.3%". */
export function percent(share: number | null | undefined, places = 1): string {
  if (share === null || share === undefined || Number.isNaN(share)) return '—';
  return `${(share * 100).toFixed(places)}%`;
}

/** Paise in, rupees out (RULES R11): every money figure the API gives is paise. */
export function rupees(paise: number | null | undefined, compactly = false): string {
  if (paise === null || paise === undefined || Number.isNaN(paise)) return '—';
  const value = paise / 100;
  return `₹${compactly && Math.abs(value) >= 1000 ? COMPACT.format(value) : value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Coins are fractional by design (0.095 per 100 steps), so they keep two places. */
export function coins(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const DATE_TIME = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
});
const DATE_ONLY = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const DAY_SHORT = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' });

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? '—' : DATE_TIME.format(at);
}

export function date(iso: string | null | undefined): string {
  if (!iso) return '—';
  const at = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(at.getTime()) ? '—' : DATE_ONLY.format(at);
}

/** "04 Oct" — an axis tick for a local-day string. */
export function dayTick(day: string): string {
  const at = new Date(`${day}T00:00:00`);
  return Number.isNaN(at.getTime()) ? day : DAY_SHORT.format(at);
}

/**
 * "4 hours ago", and "in 3 days" for something still to come.
 *
 * Every operator question starts with how old the answer is — a health report
 * from last Tuesday shown as a bare timestamp invites reading it as current.
 */
export function ago(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return '—';
  const seconds = Math.round((at - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return relative.format(seconds, 'second');
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 2_592_000) return relative.format(Math.round(seconds / 86_400), 'day');
  if (abs < 31_536_000) return relative.format(Math.round(seconds / 2_592_000), 'month');
  return relative.format(Math.round(seconds / 31_536_000), 'year');
}

/** A span in hours, as the longest unit that is still honest. */
export function hours(count: number | null | undefined): string {
  if (count === null || count === undefined) return '—';
  if (count < 48) return `${count} h`;
  return `${Math.round(count / 24)} d`;
}

/** 325,000 ms → "5m 25s" — a heartbeat age, as the phone reported it. */
export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes}m ${total % 60}s`;
  const hrs = Math.floor(minutes / 60);
  return `${hrs}h ${minutes % 60}m`;
}

/** A signed share against a named period: "+18% vs previous 30 days". */
export function delta(now: number, before: number): { label: string; direction: 'up' | 'down' | 'flat' } {
  if (before === 0) {
    if (now === 0) return { label: 'no change', direction: 'flat' };
    return { label: 'first in this window', direction: 'up' };
  }
  const change = (now - before) / before;
  const rounded = Math.round(change * 1000) / 10;
  if (rounded === 0) return { label: 'no change', direction: 'flat' };
  return { label: `${rounded > 0 ? '+' : ''}${rounded}%`, direction: rounded > 0 ? 'up' : 'down' };
}

/** `usr_01JA…` → `usr_01JA…9K2` with the middle dropped, for a column. */
export function shortId(id: string | null | undefined, keep = 6): string {
  if (!id) return '—';
  return id.length <= keep * 2 + 1 ? id : `${id.slice(0, keep)}…${id.slice(-keep)}`;
}

/** "Pixel 8 (Google)" from whatever of the two the phone reported. */
export function deviceLabel(
  device: { brand?: string | null; model?: string | null; manufacturer?: string | null } | null | undefined,
  fallback = 'Unknown phone',
): string {
  if (!device) return fallback;
  const name = [device.brand ?? device.manufacturer, device.model].filter(Boolean).join(' ');
  return name || fallback;
}

/** Sentence case for an event or fault name: `order_paid` → "Order paid". */
export function humanise(name: string): string {
  const spaced = name.replace(/[_.-]+/g, ' ').replace(/([a-z\d])([A-Z])/g, '$1 $2').toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * One of the formats above, chosen by name.
 *
 * Charts are client components and a formatter function cannot cross that
 * boundary, so a page says which format it wants and the chart applies it.
 */
export function formatBy(kind: 'number' | 'compact' | 'coins' | 'rupees' | 'percent', value: number): string {
  switch (kind) {
    case 'compact':
      return compact(value);
    case 'coins':
      return coins(value);
    case 'rupees':
      return rupees(value, true);
    case 'percent':
      return percent(value);
    default:
      return number(value);
  }
}

/**
 * The zone's offset from UTC at one instant, in milliseconds.
 *
 * `Intl` will tell you what the wall clock in a zone reads at an instant but
 * not what the offset is, so the wall clock is read and the difference taken.
 */
function zoneOffsetMs(at: number, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(at));
  const read = (type: string): number => Number(parts.find(part => part.type === type)?.value ?? 0);
  const asIfUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour') % 24, read('minute'), read('second'));
  return asIfUtc - at;
}

/**
 * An instant as `YYYY-MM-DDTHH:mm` in `zone` — what a `datetime-local` input holds.
 *
 * Always formatted on the server and handed to the form as a string: an input
 * whose default value was computed in the browser's zone on the client and the
 * server's on the server is a hydration mismatch, and a silent one.
 */
export function localInputValue(iso: string | null | undefined, zone: string): string {
  if (!iso) return '';
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return '';
  return new Date(at + zoneOffsetMs(at, zone)).toISOString().slice(0, 16);
}

/**
 * The instant a `YYYY-MM-DDTHH:mm` in `zone` names, as an ISO string.
 *
 * The input carries no zone, so `new Date(value)` would read it in whichever
 * zone the process happens to be in — which for a server action is the
 * container's, not the operator's. The offset is applied explicitly instead,
 * and once more at the result so a boundary lands on the right side of it.
 */
export function instantFromLocalInput(value: string, zone: string): string | null {
  const guess = Date.parse(`${value.length === 16 ? value : value.slice(0, 16)}:00Z`);
  if (Number.isNaN(guess)) return null;
  const once = guess - zoneOffsetMs(guess, zone);
  return new Date(guess - zoneOffsetMs(once, zone)).toISOString();
}
