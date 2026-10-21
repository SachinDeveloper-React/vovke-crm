/**
 * Reading a filter off the URL.
 *
 * Every filter in the panel lives in the query string, so each view is a link
 * somebody can send. That makes the query string untrusted input like any
 * other: these clamp and whitelist rather than trust, so a hand-edited
 * `?days=9999` asks the API for something it will accept instead of a 400.
 */
export type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export function readString(params: SearchParams, key: string, fallback = ''): string {
  return (first(params[key]) ?? fallback).slice(0, 200);
}

export function readNumber(params: SearchParams, key: string, fallback: number, min: number, max: number): number {
  const raw = Number(first(params[key]));
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

export function readEnum<T extends string>(params: SearchParams, key: string, allowed: readonly T[], fallback: T): T {
  const raw = first(params[key]);
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}
