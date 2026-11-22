/** The shapes `/v1/admin/staff/*` answers with (RULES Z9). */

export type StaffRole = 'admin' | 'manager' | 'agent';
export type StaffStatus = 'active' | 'suspended' | 'deleted';

export type ActorRef = { id: string; role: string; name: string; email: string | null } | null;

export type StaffView = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  manager: { id: string; name: string; email: string; status: string } | null;
  blockedByManager: boolean;
  permissions: string[];
  effectivePermissions: string[];
  dormantPermissions: string[];
  mustChangePassword: boolean;
  totpEnabled: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string | null;
  createdBy: ActorRef;
  suspendedAt: string | null;
  suspendedBy: ActorRef;
  suspendReason: string | null;
  agents: number | null;
};

export type StaffList = {
  data: StaffView[];
  total: number;
  limit: number;
  offset: number;
  summary: Record<string, number> | null;
};

export type StaffDetail = StaffView & {
  team: StaffView[];
  can: { manage: boolean; reassign: boolean; changeRole: boolean };
};

export type PermissionCatalogue = {
  groups: Array<{ key: string; label: string; permissions: Array<{ key: string; label: string; agentGrantable: boolean }> }>;
  presets: Array<{ key: string; label: string; forRole: Array<'manager' | 'agent'>; permissions: string[] }>;
};

export type StaffSession = {
  id: string;
  createdAt: string | null;
  lastSeenAt: string | null;
  expiresAt: string;
  ip: string | null;
  userAgent: string | null;
  mfa: boolean;
  current: boolean;
};

export type ActivityRow = {
  id: string;
  at: string;
  actor: { kind: string; id: string | null; role: string | null; name: string | null; email: string | null; managerId: string | null };
  kind: 'read' | 'write' | 'auth';
  event: string | null;
  method: string | null;
  route: string | null;
  path: string | null;
  params: Record<string, string> | null;
  query: unknown;
  body: unknown;
  permission: string | null;
  status: number | null;
  errorCode: string | null;
  ok: boolean;
  targetStaffId: string | null;
  /** The person's own address, as the panel reported it (or what the API saw). */
  ip: string | null;
  /** The address the API saw, when it differs — the panel's own server. */
  via: string | null;
  userAgent: string | null;
  durationMs: number | null;
};

export type ActivityList = { data: ActivityRow[]; total: number; limit: number; offset: number };
