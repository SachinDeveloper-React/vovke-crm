/**
 * The zone the dashboard reads in.
 *
 * Its own module rather than a constant in `api.ts`, because that file is
 * `server-only` and the formatters in `format.ts` are imported by the chart
 * components too, which run in the browser.
 *
 * Nothing is ever formatted in the zone the process happens to be in: that
 * is the operator's own machine in development and UTC on the server, so the
 * same instant would be written two different ways and neither would say
 * which clock it was on.
 */
export const ADMIN_TIMEZONE = process.env.VOKVE_ADMIN_TIMEZONE ?? 'Asia/Kolkata';
