/**
 * Words both halves of the page need — the server-rendered list and the
 * client forms — so they live outside either (a function exported from a
 * `'use client'` file cannot be called while rendering on the server).
 */

/** 0 = Monday … 6 = Sunday, the API's numbering (RULES Y5). */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
