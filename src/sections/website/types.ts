import type { JsonSchema } from './schema';

/** The API's Website answers (`vokve-backend/src/modules/site/*`, RULES P22). */

export type WebsiteRefresh = 'done' | 'off' | 'failed';

export interface SitePageRow {
  key: string;
  label: string;
  path: string | null;
  caption: string;
  isDefault: boolean;
  invalid: string | null;
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SiteDocumentRow {
  slug: string;
  path: string;
  title: string;
  published: boolean;
  listed: boolean;
  version: string;
  effectiveAt: string;
  shownUpdatedAt: string;
  shipped: boolean;
  core: boolean;
  isDefault: boolean;
  invalid: string | null;
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SiteOverview {
  siteUrl: string;
  refresh: 'on' | 'off';
  pages: SitePageRow[];
  documents: SiteDocumentRow[];
  enquiries: { new: number; open: number; total: number };
}

export interface SiteToken {
  name: string;
  value: string | null;
  /** `config` is filled by the API from ⚙ figures; `contact` by the website from Contact & links. */
  source: 'config' | 'contact';
}

export interface FaqOption {
  id: string;
  question: string;
  category: string;
  active: boolean;
  /** Off: kept to the app, so the website leaves it out even when picked. */
  website: boolean;
}

/** What an editor opens with: the content, its shape, and the lists its special boxes pick from. */
export interface EditorData {
  content: Record<string, unknown>;
  revision: number;
  isDefault: boolean;
  invalid: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  schema: JsonSchema;
  icons: string[];
  tokens: SiteToken[];
  faqOptions?: FaqOption[];
}

export interface SitePageEdit extends EditorData {
  key: string;
  label: string;
  path: string | null;
  caption: string;
}

export interface SiteDocumentEdit extends EditorData, Omit<SiteDocumentRow, keyof EditorData> {}

export interface SiteRevision {
  id: string;
  revision: number;
  action: 'saved' | 'restored' | 'reset' | 'created' | 'deleted';
  savedBy: string;
  note: string | null;
  at: string | null;
}

export type EnquiryStatus = 'new' | 'open' | 'replied' | 'closed' | 'spam';

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  page: string | null;
  status: EnquiryStatus;
  userId: string | null;
  note: string | null;
  replies: Array<{ id: string; body: string; by: string; via: 'sent' | 'logged'; at: string | null }>;
  handledBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EnquiryList {
  total: number;
  offset: number;
  limit: number;
  counts: Record<EnquiryStatus, number>;
  emailConfigured: boolean;
  data: Enquiry[];
}

export interface EnquiryDetail extends Enquiry {
  emailConfigured: boolean;
  earlier: Array<{ id: string; topic: string | null; status: EnquiryStatus; createdAt: string | null }>;
}
