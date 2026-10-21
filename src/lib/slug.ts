/**
 * `Yoga & Pilates` → `yoga-pilates`.
 *
 * The same rule the API applies to a name it is given no slug for, written
 * here as well so a form can show what the slug will be while it is being
 * typed. Its own module because both ends need it and one of them is a
 * `'use server'` file, which may only export actions.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
