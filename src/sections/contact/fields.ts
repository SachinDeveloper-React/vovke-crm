/**
 * Contact & links (RULES P21): every detail a member or a visitor uses to
 * reach the company, and every link the app and the website open — as one
 * page of labelled boxes over the config keys that hold them.
 *
 * Pure, so the node test can hold it: what each box is, how what somebody
 * typed becomes the value the key holds, and which keys a save really
 * changes. The API checks the form of every one of them again (an address
 * mail can reach, a number in international form, an https link), so this
 * is about being forgiving with what people type, not about being the gate.
 */

export type ContactKind = 'email' | 'phone' | 'url' | 'text' | 'lines' | 'switch';

export interface ContactField {
  /** The config key, as the API names it. */
  path: string;
  label: string;
  kind: ContactKind;
  /** May be left empty — the app or the site then leaves that thing out. */
  nullable: boolean;
  /** Where a member or a visitor sees it. */
  shows: string;
  placeholder?: string;
}

export interface ContactGroup {
  id: string;
  title: string;
  subtitle: string;
  fields: ContactField[];
}

export const CONTACT_GROUPS: ContactGroup[] = [
  {
    id: 'reach',
    title: 'How members reach you',
    subtitle: 'The ways to contact support, and what you promise about answering',
    fields: [
      {
        path: 'support.email',
        label: 'Support email',
        kind: 'email',
        nullable: false,
        shows: 'App: Help → Contact us, About · Website: header, footer, Contact, legal pages, account deletion',
        placeholder: 'support@vokve.com',
      },
      {
        path: 'support.phone',
        label: 'Support phone',
        kind: 'phone',
        nullable: true,
        shows: 'App: Help → Contact us (“Call us”) · Website: Contact. Empty takes the number off both.',
        placeholder: '+91 98765 43210',
      },
      {
        path: 'support.whatsapp',
        label: 'WhatsApp number',
        kind: 'phone',
        nullable: true,
        shows: 'App: Help → Contact us (“WhatsApp”) · Website: Contact. Empty hides it.',
        placeholder: '+91 98765 43210',
      },
      {
        path: 'support.hours',
        label: 'Support hours',
        kind: 'text',
        nullable: true,
        shows: 'Under the phone and WhatsApp rows, in the app and on the website. Empty means always open.',
        placeholder: 'Mon–Sat, 9 am – 7 pm IST',
      },
      {
        path: 'support.responseTime',
        label: 'Reply-time promise',
        kind: 'text',
        nullable: false,
        shows: 'App: Help page and under “Email us” · Website: Contact',
        placeholder: 'We usually reply within 24 hours.',
      },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    subtitle: 'The name and address the website and the legal pages print',
    fields: [
      {
        path: 'support.company',
        label: 'Company name',
        kind: 'text',
        nullable: false,
        shows: 'App: About · Website: footer, Contact, legal pages',
        placeholder: 'VOKVE Fitness',
      },
      {
        path: 'support.address',
        label: 'Address',
        kind: 'lines',
        nullable: false,
        shows: 'Website: Contact (company details). One line per row.',
        placeholder: 'VOKVE Fitness\nIndia',
      },
      {
        path: 'support.grievanceOfficer.name',
        label: 'Grievance Officer — name',
        kind: 'text',
        nullable: true,
        shows: 'Website: Contact and the privacy policy. India’s IT and data-protection rules ask for a named officer.',
        placeholder: 'Full name',
      },
      {
        path: 'support.grievanceOfficer.email',
        label: 'Grievance Officer — email',
        kind: 'email',
        nullable: true,
        shows: 'Website: Contact and the privacy policy. Empty uses the support email.',
        placeholder: 'grievance@vokve.com',
      },
    ],
  },
  {
    id: 'links',
    title: 'Website & legal pages',
    subtitle: 'Where the app sends people to read the policies, and where invite links land',
    fields: [
      {
        path: 'support.links.website',
        label: 'Website',
        kind: 'url',
        nullable: false,
        shows: 'App: About',
        placeholder: 'https://vokve.com',
      },
      {
        path: 'support.links.privacy',
        label: 'Privacy policy',
        kind: 'url',
        nullable: false,
        shows: 'App: About, and the Health Connect permission screen (Google checks this link)',
        placeholder: 'https://vokve.com/privacy',
      },
      {
        path: 'support.links.terms',
        label: 'Terms of use',
        kind: 'url',
        nullable: false,
        shows: 'App: About',
        placeholder: 'https://vokve.com/terms',
      },
      {
        path: 'support.links.licenses',
        label: 'Open-source licences',
        kind: 'url',
        nullable: false,
        shows: 'App: About',
        placeholder: 'https://vokve.com/licenses',
      },
      {
        path: 'support.inviteUrlBase',
        label: 'Invite link address',
        kind: 'url',
        nullable: false,
        shows: 'App: Refer a friend — every shared link is this address, then “/” and the member’s code',
        placeholder: 'https://vokve.com/r',
      },
    ],
  },
  {
    id: 'stores',
    title: 'App stores',
    subtitle: 'Where the update screen and the website’s download buttons send people',
    fields: [
      {
        path: 'app.storeUrl.android',
        label: 'Google Play link',
        kind: 'url',
        nullable: false,
        shows: 'App: the update screen on Android · Website: download button',
        placeholder: 'https://play.google.com/store/apps/details?id=com.vokve.fitness',
      },
      {
        path: 'app.storeListed.android',
        label: 'Live on Google Play',
        kind: 'switch',
        nullable: false,
        shows: 'Website: off shows “Coming soon” instead of the Google Play button',
      },
      {
        path: 'app.storeUrl.ios',
        label: 'App Store link',
        kind: 'url',
        nullable: false,
        shows: 'App: the update screen on iPhone · Website: download button',
        placeholder: 'https://apps.apple.com/app/id0000000000',
      },
      {
        path: 'app.storeListed.ios',
        label: 'Live on the App Store',
        kind: 'switch',
        nullable: false,
        shows: 'Website: off shows “Coming soon” instead of the App Store button',
      },
    ],
  },
  {
    id: 'social',
    title: 'Social profiles',
    subtitle: 'Full links to the company’s pages; an empty one is left off the website',
    fields: [
      { path: 'support.social.instagram', label: 'Instagram', kind: 'url', nullable: true, shows: 'Website: footer', placeholder: 'https://instagram.com/vokve' },
      { path: 'support.social.facebook', label: 'Facebook', kind: 'url', nullable: true, shows: 'Website: footer', placeholder: 'https://facebook.com/vokve' },
      { path: 'support.social.x', label: 'X (Twitter)', kind: 'url', nullable: true, shows: 'Website: footer', placeholder: 'https://x.com/vokve' },
      { path: 'support.social.youtube', label: 'YouTube', kind: 'url', nullable: true, shows: 'Website: footer', placeholder: 'https://youtube.com/@vokve' },
      { path: 'support.social.linkedin', label: 'LinkedIn', kind: 'url', nullable: true, shows: 'Website: footer', placeholder: 'https://linkedin.com/company/vokve' },
    ],
  },
  {
    id: 'orders',
    title: 'Order tracking',
    subtitle: 'The courier’s tracking page an order’s “Track live” button opens',
    fields: [
      {
        path: 'commerce.trackingUrlTemplate',
        label: 'Tracking link',
        kind: 'url',
        nullable: true,
        shows: 'App: Order details → Track live. {ref} is replaced with the order’s tracking number; empty hides the button.',
        placeholder: 'https://courier.example.com/track/{ref}',
      },
    ],
  },
];

export const CONTACT_PATHS = CONTACT_GROUPS.flatMap(group => group.fields.map(field => field.path));

/** `{ a: { b: 1 } }`, `'a.b'` → `1`. */
export function at(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Record<string, unknown>)[key];
  }, source);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * A phone number as the API keeps it: `+` and digits (E.164).
 *
 * People type numbers the way they read them — spaces, dashes, a leading
 * zero, no country code. An Indian mobile written any of those ways becomes
 * `+91…`; anything else keeps its own `+` code with the punctuation taken
 * out, and whatever is still not a number goes to the API, which says why.
 */
export function normalisePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  const compact = trimmed.replace(/[\s().-]/g, '');
  const plus = compact.startsWith('+');
  const digits = compact.replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return trimmed;
  if (plus) return `+${digits}`;
  if (/^0?[6-9]\d{9}$/.test(digits)) return `+91${digits.slice(-10)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^00\d{8,15}$/.test(digits)) return `+${digits.slice(2)}`;
  return trimmed;
}

/** A link typed without its scheme gets `https://`; one with a scheme is left for the API to judge. */
export function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '' || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/** What a box's text becomes, as the value its key holds. */
export function readField(field: ContactField, raw: string | null): unknown {
  if (field.kind === 'switch') return raw === 'on' || raw === 'true';
  const text = (raw ?? '').trim();
  if (field.kind === 'lines') {
    return (raw ?? '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  if (text === '') return field.nullable ? null : '';
  if (field.kind === 'phone') return normalisePhone(text);
  if (field.kind === 'url') return normaliseUrl(text);
  return text;
}

/** How a value is put back in a box. */
export function showField(field: ContactField, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (field.kind === 'lines') return Array.isArray(value) ? value.join('\n') : String(value);
  return String(value);
}

/**
 * What saving a group sends: only the keys whose value really moves.
 *
 * A key typed back to exactly what the code ships is *reset* rather than
 * set, so it follows the code again — a stored copy of a default is how a
 * database ends up pinned to an old one (D-112). A key left as it was is
 * not sent at all.
 */
export function planSave(
  group: ContactGroup,
  read: (path: string) => string | null,
  current: (path: string) => unknown,
  shipped: (path: string) => unknown,
): { set: Record<string, unknown>; reset: string[]; changed: ContactField[] } {
  const set: Record<string, unknown> = {};
  const reset: string[] = [];
  const changed: ContactField[] = [];
  for (const field of group.fields) {
    const next = readField(field, read(field.path));
    if (same(next, current(field.path))) continue;
    changed.push(field);
    if (same(next, shipped(field.path))) reset.push(field.path);
    else set[field.path] = next;
  }
  return { set, reset, changed };
}

/** The API names keys (`support.email: …`); the operator knows them by their labels. */
export function labelled(message: string): string {
  let out = message;
  for (const group of CONTACT_GROUPS) {
    for (const field of group.fields) out = out.split(`${field.path}:`).join(`${field.label}:`);
  }
  return out;
}

/** A value still naming the placeholder domain the company never owned (D-112). */
export function namesRetiredDomain(value: unknown): boolean {
  return /\bvokve\.app\b/.test(JSON.stringify(value ?? null));
}
