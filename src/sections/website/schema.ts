/**
 * Reading the shape of a website page (RULES P22).
 *
 * The API hands every editor the JSON Schema of what it will accept — made
 * by `z.toJSONSchema()` from the same zod shape that checks the save — and
 * the editor is drawn from it. So a field added to a page on the API shows
 * up here with no panel change, and the panel cannot offer a box the API
 * would refuse. These are the pure pieces: what kind of box a schema wants,
 * what a new item starts as, and how a value is changed at a path. No React,
 * so they are tested on their own (`schema.test.ts`).
 */

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  title?: string;
  description?: string;
  /** The API's hint for a special box: `icon`, `date`, `numbers`, `faq-ids`, `href`. */
  widget?: string;
  multiline?: boolean;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  format?: string;
}

export type FieldKind =
  | { kind: 'object'; schema: JsonSchema }
  | { kind: 'array'; schema: JsonSchema; items: JsonSchema }
  | { kind: 'text'; schema: JsonSchema; multiline: boolean }
  | { kind: 'enum'; schema: JsonSchema; options: string[] }
  | { kind: 'number'; schema: JsonSchema; integer: boolean }
  | { kind: 'boolean'; schema: JsonSchema }
  | { kind: 'variants'; schema: JsonSchema; variants: JsonSchema[]; discriminator: string }
  | { kind: 'unknown'; schema: JsonSchema };

const isNullSchema = (schema: JsonSchema) => schema.type === 'null';

/**
 * Splits "this or nothing" into the thing and the fact it may be nothing.
 * zod writes a nullable string as `type: ['string', 'null']` and a nullable
 * object as `anyOf: [{…}, {type: 'null'}]`; both come out the same here.
 */
export function unwrapNullable(schema: JsonSchema): { nullable: boolean; inner: JsonSchema } {
  if (Array.isArray(schema.type) && schema.type.includes('null')) {
    const rest = schema.type.filter(type => type !== 'null');
    return { nullable: true, inner: { ...schema, type: rest.length === 1 ? rest[0] : rest } };
  }
  if (schema.anyOf && schema.anyOf.some(isNullSchema)) {
    const rest = schema.anyOf.filter(option => !isNullSchema(option));
    const inner = rest.length === 1 ? { ...rest[0], ...pick(schema) } : { ...schema, anyOf: rest };
    return { nullable: true, inner };
  }
  return { nullable: false, inner: schema };
}

/** The labelling keys of an outer schema, which a nullable's inner one should keep. */
function pick(schema: JsonSchema): JsonSchema {
  const kept: JsonSchema = {};
  if (schema.title) kept.title = schema.title;
  if (schema.description) kept.description = schema.description;
  if (schema.widget) kept.widget = schema.widget;
  return kept;
}

/** Text that reads as a paragraph rather than a line. */
const LONG_TEXT = new Set([
  'body',
  'text',
  'subtitle',
  'description',
  'summary',
  'answer',
  'intro',
  'blurb',
  'note',
  'bodyTemplate',
  'reason',
  'disclaimer',
  'grievanceNote',
  'consent',
  'successBody',
  'errorBody',
  'rateLimitedBody',
  'notFoundBody',
  'paragraphs',
  'highlights',
]);

export function fieldKind(schema: JsonSchema, key = ''): FieldKind {
  const variants = schema.oneOf ?? (schema.anyOf && !schema.anyOf.some(isNullSchema) ? schema.anyOf : undefined);
  if (variants && variants.length > 0) {
    const discriminator = discriminatorOf(variants);
    if (discriminator) return { kind: 'variants', schema, variants, discriminator };
    return { kind: 'unknown', schema };
  }
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (schema.enum && schema.enum.every(value => typeof value === 'string')) {
    return { kind: 'enum', schema, options: schema.enum as string[] };
  }
  switch (type) {
    case 'object':
      return { kind: 'object', schema };
    case 'array':
      return { kind: 'array', schema, items: schema.items ?? {} };
    case 'string':
      return { kind: 'text', schema, multiline: schema.multiline === true || LONG_TEXT.has(key) };
    case 'number':
    case 'integer':
      return { kind: 'number', schema, integer: type === 'integer' };
    case 'boolean':
      return { kind: 'boolean', schema };
    default:
      return { kind: 'unknown', schema };
  }
}

/** The key whose `const` tells the variants apart — `type` for a policy's blocks. */
function discriminatorOf(variants: JsonSchema[]): string | null {
  const first = variants[0]?.properties;
  if (!first) return null;
  for (const [key, prop] of Object.entries(first)) {
    if (prop.const === undefined) continue;
    if (variants.every(variant => variant.properties?.[key]?.const !== undefined)) return key;
  }
  return null;
}

/** What a new item, or a section switched back on, starts as. */
export function emptyOf(schema: JsonSchema): unknown {
  if (schema.default !== undefined && schema.default !== null) return structuredClone(schema.default);
  const { nullable, inner } = unwrapNullable(schema);
  if (nullable && schema.default === null) return null;
  const kind = fieldKind(inner);
  switch (kind.kind) {
    case 'object': {
      const value: Record<string, unknown> = {};
      const required = new Set(inner.required ?? []);
      for (const [key, prop] of Object.entries(inner.properties ?? {})) {
        if (!required.has(key) && prop.default === undefined) continue;
        const own = unwrapNullable(prop);
        // A section that may be left out starts left out; a line that may be empty starts empty.
        value[key] = own.nullable && fieldKind(own.inner).kind === 'object' ? null : emptyOf(prop);
      }
      return value;
    }
    case 'array':
      return Array.from({ length: inner.minItems ?? 0 }, () => emptyOf(kind.items));
    case 'enum':
      return kind.options[0] ?? '';
    case 'number':
      return inner.minimum !== undefined && inner.minimum > 0 ? inner.minimum : 0;
    case 'boolean':
      return false;
    case 'variants':
      return emptyOf(kind.variants[0]!);
    case 'text':
      return inner.const !== undefined ? inner.const : '';
    default:
      return nullable ? null : '';
  }
}

/** A copy of `value` with `path` (dotted, as the API's errors name it) set to `next`. */
export function setIn(value: unknown, path: string[], next: unknown): unknown {
  if (path.length === 0) return next;
  const [head, ...rest] = path as [string, ...string[]];
  if (Array.isArray(value)) {
    const index = Number(head);
    const copy = value.slice();
    copy[index] = setIn(copy[index], rest, next);
    return copy;
  }
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return { ...record, [head]: setIn(record[head], rest, next) };
}

export const joinPath = (parent: string, key: string | number) => (parent ? `${parent}.${key}` : String(key));

const LABELS: Record<string, string> = {
  seo: 'Search & sharing',
  eyebrow: 'Section label',
  cta: 'Button',
  href: 'Link',
  primaryCta: 'Main button',
  secondaryCta: 'Second button',
  headerCta: 'Header button',
  nav: 'Header menu',
  howItWorks: 'How it works',
  fairPlay: 'Fair play',
  faq: 'Questions',
  inApp: 'In the app',
  noAccess: 'No app any more',
  faqs: 'Questions',
  faqTitle: 'Questions title',
  itemIds: 'Questions',
  siteUrl: 'Website address',
  titleTemplate: 'Title pattern',
  defaultTitle: 'Default title',
  effectiveAt: 'Effective from',
  updatedAt: 'Last updated',
  codePattern: 'Code pattern',
  photoUrl: 'Photo link',
  rewardLabel: 'Reward',
  badgeLabel: 'Badge',
  stepsLabel: 'Steps word',
  goalLabel: 'Goal words',
  dayLabel: 'Day word',
  verifiedLabel: 'Verified word',
  grievanceOfficerTitle: 'Grievance Officer heading',
  extraLinks: 'More links',
  liveWords: 'Words for the live board',
  live: 'Show the live challenges',
  companyTitle: 'Company box title',
  bodyTemplate: 'Email text',
  buttonLabel: 'Button',
};

/** "primaryCta" → "Main button"; anything not named above → "Primary cta". */
export function labelFor(key: string, schema?: JsonSchema): string {
  if (schema?.title) return schema.title;
  if (LABELS[key]) return LABELS[key];
  if (/^\d+$/.test(key)) return `#${Number(key) + 1}`;
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const SUMMARY_KEYS = ['title', 'label', 'question', 'name', 'term', 'item', 'when', 'text', 'value', 'id'];

/** The line a collapsed list item shows: its title, its label, its question… */
export function summaryOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  // A policy's blocks: say what kind it is and how it starts.
  const first = (list: unknown) => (Array.isArray(list) && list.length > 0 ? list[0] : null);
  if (record.type === 'table' && Array.isArray(record.columns)) return `Table · ${record.columns.join(' · ')}`;
  if (record.type === 'list') {
    const item = first(record.items);
    return `List · ${typeof item === 'string' ? item : ''}`;
  }
  if (record.type === 'definitions') {
    const item = first(record.items) as { term?: unknown } | null;
    return `Definitions · ${typeof item?.term === 'string' ? item.term : ''}`;
  }
  if (record.type === 'callout') return `Callout · ${typeof record.title === 'string' && record.title ? record.title : String(record.text ?? '')}`;
  for (const key of SUMMARY_KEYS) {
    const found = record[key];
    if (typeof found === 'string' && found.trim()) return found;
  }
  if (typeof record.type === 'string') return record.type;
  return '';
}

/** Errors at or under `path`, for a section that should say it holds one. */
export function errorsUnder(errors: Record<string, string>, path: string): number {
  if (!path) return Object.keys(errors).length;
  return Object.keys(errors).filter(key => key === path || key.startsWith(`${path}.`)).length;
}
