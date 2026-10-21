/**
 * The admin API's answers, as types.
 *
 * Hand-written against `vokve-backend/src/modules/admin/*` rather than
 * generated: there is no schema to generate from (the admin reads are shaped
 * in their services, not in `contracts/`), and a type that drifts is louder
 * than a type that was never there — every field below is read by a page, so
 * a rename in the API surfaces here as a compile error.
 */

export type Platform = 'ios' | 'android';
export type Severity = 'high' | 'medium' | 'low';
export type PermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'unknown';
export type PermissionKey =
  | 'activityRecognition'
  | 'notifications'
  | 'healthConnectReadSteps'
  | 'healthConnectWriteSteps'
  | 'batteryUnrestricted'
  | 'camera'
  | 'photos';

export interface Trust {
  score: number | null;
  tier: string | null;
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
  total?: number;
  offset?: number;
  limit?: number;
}

// ─── GET /admin/users ──────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  phone: string;
  name: string;
  trust: Trust;
  emailVerified: boolean;
  phoneVerified: boolean;
  deleted: boolean;
  frozen: boolean;
  legalHold: boolean;
  deletionScheduledAt: string | null;
  country: string | null;
  createdAt: string | null;
  installedAt: string | null;
  devices: number;
  platform: Platform | null;
  appVersion: string | null;
  lastSeenAt: string | null;
}

// ─── GET /admin/users/:id ──────────────────────────────────────────────────

export interface PermissionSummary {
  reportedAt: string | null;
  granted: PermissionKey[];
  denied: PermissionKey[];
  blocked: PermissionKey[];
  unavailable: PermissionKey[];
  unknown: PermissionKey[];
}

export interface Install {
  deviceId: string;
  platform: Platform;
  device: {
    brand: string | null;
    manufacturer: string | null;
    model: string | null;
    name: string | null;
    osVersion: string | null;
    isEmulator: boolean | null;
    isTablet: boolean | null;
    totalMemoryMb: number | null;
    carrier: string | null;
    locale: string | null;
    timezone: string | null;
    screen: { w: number; h: number; scale: number } | null;
    hasBiometrics: boolean | null;
  };
  app: { version: string | null; build: string | null; firstVersion: string | null; bundleId: string | null };
  installedAt: string | null;
  lastActiveAt: string | null;
  revokedAt: string | null;
  signedIn: boolean;
  signedInAt: string | null;
  lastSignedOutAt: string | null;
  logins: number;
  session: {
    live: boolean;
    tokens: number;
    issuedAt: string | null;
    lastRefreshAt: string | null;
    expiresAt: string | null;
  };
  push: { hasToken: boolean; updatedAt: string | null; invalidAt: string | null };
  remindersScheduledAt: string | null;
  integrity: {
    provider: string | null;
    verdict: string | null;
    checkedAt: string | null;
    attested: boolean | null;
    securityLevel: string | null;
  };
  signals: {
    rooted: boolean | null;
    emulator: boolean | null;
    debugBuild: boolean | null;
    hookingFramework: boolean | null;
    mockLocation: boolean | null;
    developerMode: boolean | null;
  };
  permissions: PermissionSummary;
}

export interface UserOverview {
  account: {
    id: string;
    name: string;
    email: string;
    phone: string;
    emailVerifiedAt: string | null;
    phoneVerifiedAt: string | null;
    signedUpAt: string | null;
    profileCompletedAt: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    country: string | null;
    timezone: string | null;
    trust: Trust;
    flags: { frozen: boolean; legalHold: boolean };
    deletion: { scheduledAt: string | null; purgeAt: string | null; reason: string | null };
    lastExportAt: string | null;
    deletedAt: string | null;
  };
  activity: {
    lastActiveAt: string | null;
    lastScreen: string | null;
    lastScreenAt: string | null;
    firstEventAt: string | null;
    lastEventAt: string | null;
    events: number;
    events7d: number;
    events30d: number;
  };
  wallet: { balance: number; pending: number; lifetimeEarned: number; lastCreditAt: string | null };
  orders: { count: number; payable: number; coinsUsed: number; lastAt: string | null };
  counts: { devices: number; activeDevices: number; logins: number; liveSessions: number };
  installs: Install[];
}

// ─── GET /admin/users/:id/logins ───────────────────────────────────────────

export interface LoginRow {
  at: string;
  until: string | null;
  open: boolean;
  deviceId: string;
  platform: Platform;
  model: string | null;
  osVersion: string | null;
  appVersion: string | null;
}

// ─── GET /admin/users/:id/activity ─────────────────────────────────────────

export interface TrailRow {
  id: string;
  name: string;
  screen: string | null;
  at: string;
  receivedAt: string;
  sessionId: string | null;
  props: Record<string, unknown> | null;
  deviceId: string;
  platform: Platform | null;
  appVersion: string | null;
  build: string | null;
}

export interface TrailSummary {
  days: number;
  timezone: string;
  events: number;
  sessions: number;
  firstAt: string | null;
  lastAt: string | null;
  screens: { screen: string; views: number; lastAt: string }[];
  actions: { name: string; count: number; lastAt: string }[];
  byDay: { date: string; events: number; screens: number }[];
}

// ─── GET /admin/users/:id/permissions ──────────────────────────────────────

export interface PermissionStatus {
  key: PermissionKey;
  state: PermissionState;
  detail?: string;
  since: string;
  checkedAt: string;
}

export interface DevicePermissionRow {
  deviceId: string;
  platform: Platform;
  model: string | null;
  brand: string | null;
  osVersion: string | null;
  appVersion: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  revoked: boolean;
  hasPushToken: boolean;
  remindersScheduledAt: string | null;
  permissions: PermissionStatus[];
  history: { key: string; from: string | null; to: string; at: string }[];
  reportedAt: string | null;
}

// ─── GET /admin/users/:id/health ───────────────────────────────────────────

export interface TrackingHealth {
  state?: string;
  wanted?: boolean;
  serviceAlive?: boolean;
  looksDead?: boolean;
  heartbeatAgeMs?: number;
  recoveryCount?: number;
  lastRecoveryReason?: string | null;
  batteryOptimizationEnabled?: boolean;
  aggressiveOem?: boolean;
  manufacturer?: string | null;
}

export interface HealthConnectHealth {
  availability?: string | null;
  canRead?: boolean;
  canWrite?: boolean;
  grantedReadTypes?: string[];
}

export interface SyncHealth {
  status?: 'idle' | 'syncing' | 'failed';
  lastSyncedAt?: string | null;
  queued?: number;
  error?: string | null;
  todaySteps?: number;
}

export interface AppErrorRow {
  fingerprint: string;
  kind: string;
  name: string | null;
  message: string;
  scope: string | null;
  screen: string | null;
  fatal: boolean;
  count: number;
  firstAt: string | null;
  lastAt: string | null;
  appVersion: string | null;
  build: string | null;
  osVersion: string | null;
  deviceId: string;
  context: Record<string, unknown> | null;
  stack: string | null;
}

export interface DeviceHealth {
  devices: {
    deviceId: string;
    platform: Platform;
    model: string | null;
    brand: string | null;
    manufacturer: string | null;
    appVersion: string | null;
    lastSeenAt: string | null;
    revoked: boolean;
    signedIn: boolean;
    stepSync: { uploadedAt: string | null; nudgedAt: string | null; remindedAt: string | null };
    health: {
      at: string | null;
      stale: boolean;
      tracking: TrackingHealth | null;
      healthConnect: HealthConnectHealth | null;
      sync: SyncHealth | null;
    } | null;
  }[];
  errors: { total: number; data: AppErrorRow[] };
}

// ─── GET /admin/users/:id/problems ─────────────────────────────────────────

export interface Finding {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  fix: string;
  deviceId?: string;
  since?: string | null;
  evidence?: Record<string, unknown>;
}

export interface ProblemReport {
  summary: { headline: string | null; high: number; medium: number; low: number; installs: number; signedIn: number };
  findings: Finding[];
}

// ─── GET /admin/health/fleet ───────────────────────────────────────────────

export interface FleetReport {
  days: number;
  installs: {
    total: number;
    signedIn: number;
    reportingSteps: number;
    quiet: number;
    reportingHealth: number;
    healthStale: number;
  };
  problems: { code: string; installs: number }[];
  byManufacturer: { manufacturer: string; installs: number; serviceDead: number; batteryRestricted: number }[];
  byAppVersion: {
    appVersion: string;
    installs: number;
    errorGroups: number;
    fatalGroups: number;
    affectedUsers: number;
  }[];
  topErrors: {
    fingerprint: string;
    kind: string;
    name: string | null;
    message: string;
    scope: string | null;
    screen: string | null;
    fatal: boolean;
    occurrences: number;
    users: number;
    appVersions: string[];
    lastAt: string | null;
  }[];
}

// ─── GET /admin/activity/shadow ────────────────────────────────────────────

export interface ShadowReport {
  from: string;
  to: string;
  rate: {
    enabled: boolean;
    unitSteps: number;
    coinsPerUnit: number;
    per1000: number;
    stepCap: number;
    sourceCap: number;
    dailyCap: number;
  };
  totals: {
    users: number;
    days: number;
    steps: number;
    verifiedSteps: number;
    verifiedShare: number;
    verifiedDays: number;
    unverifiedDays: number;
    coins: number;
    coinsPerUserDay: number;
  };
  byDay: {
    localDay: string;
    users: number;
    days: number;
    steps: number;
    verifiedSteps: number;
    verifiedDays: number;
    unverifiedDays: number;
    coins: number;
  }[];
}

// ─── GET /admin/fraud/* ────────────────────────────────────────────────────

export interface FraudQueueRow {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  trust: Trust;
  frozen: boolean;
  flags: { hard: number; soft: number; info: number; open: number };
  kinds: string[];
  days: string[];
  devices: string[];
  lastFlagAt: string | null;
  heldCoins: number;
  holds: number;
  steps: number;
  verifiedSteps: number;
  activeDays: number;
}

export interface FraudQueue {
  days: number;
  data: FraudQueueRow[];
  nextCursor: string | null;
}

export interface FraudFlag {
  id: string;
  localDay: string;
  layer: string;
  kind: string;
  severity: 'hard' | 'soft' | 'info';
  status: 'open' | 'confirmed' | 'dismissed';
  deviceId: string | null;
  details: Record<string, unknown> | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

export interface FraudDayDevice {
  deviceId: string;
  phone?: unknown;
  candidate?: number;
  source?: string;
  verified?: boolean;
  verifiedSteps?: number;
  plausibility?: number;
  layers?: Record<string, number | null>;
  hard?: string[];
  flags?: string[];
  proof?: Record<string, unknown>;
  counting?: Record<string, unknown> | null;
}

export interface FraudDay {
  localDay: string;
  steps: number;
  verifiedSteps: number;
  pedometerSteps: number;
  verified: boolean;
  plausibility: number | null;
  layers: Record<string, number | null> | null;
  flags: string[];
  hardRejects: string[];
  deviceCount: number;
  devices: FraudDayDevice[];
}

export interface FraudCase {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    trust: Trust;
    frozen: boolean;
    signedUpAt: string | null;
  };
  flags: FraudFlag[];
  days: FraudDay[];
  holds: {
    id: string;
    amount: number;
    status: 'held' | 'released' | 'voided';
    reason: string | null;
    localDay: string | null;
    releaseAfter: string | null;
    createdAt: string | null;
  }[];
  attestations: {
    deviceId: string;
    provider: string;
    verdict: string;
    details: Record<string, unknown> | null;
    checkedAt: string | null;
  }[];
}

export interface VerdictResult {
  flag: { id: string; kind: string; localDay: string; severity: string; status: string };
  voided: { id: string; amount: number }[];
  trust: { score: number; tier: string; previousTier: string } | null;
}

export interface RescoreResult {
  localDay: string;
  before: { verified: boolean | null; verifiedSteps: number | null; plausibility: number | null };
  after: {
    verified: boolean | null;
    verifiedSteps: number | null;
    plausibility: number | null;
    hardRejects: string[];
    flags: string[];
  };
}

// ─── GET /admin/releases, PUT /admin/app/update-policy ─────────────────────

export interface ReleaseRow {
  id: string;
  platform: Platform;
  version: string;
  build: string;
  status: 'current' | 'supported' | 'deprecated' | 'blocked';
  notes: string | null;
  minOs: string | null;
  releasedAt: string | null;
  refused: boolean;
}

export interface UpdatePolicy {
  nudgeOnNewer: boolean;
  remindAfterHours: number;
  hardTitle: string;
  hardMessage: string;
  softTitle: string;
  softMessage: string;
  actionLabel: string;
  laterLabel: string;
}

export interface ReleasesResponse {
  minVersion: Record<Platform, string>;
  storeUrl: Record<Platform, string> | Record<string, string>;
  nudgeOnNewer: boolean;
  data: ReleaseRow[];
  nextCursor: string | null;
}

export interface UpdatePolicyResult {
  minVersion: Record<Platform, string>;
  update: UpdatePolicy;
}

// ─── GET /admin/analytics/overview ─────────────────────────────────────────

export interface Point {
  date: string;
  [key: string]: string | number;
}

export interface AnalyticsOverview {
  window: { days: number; from: string; to: string; timezone: string; generatedAt: string };
  members: {
    total: number;
    live: number;
    new: number;
    newPrevious: number;
    emailVerified: number;
    phoneVerified: number;
    profileCompleted: number;
    frozen: number;
    deletionScheduled: number;
    deleted: number;
    byTrustTier: { tier: string; members: number }[];
    byCountry: { country: string; members: number }[];
    signupsByDay: Point[];
  };
  installs: {
    total: number;
    active: number;
    signedIn: number;
    new: number;
    pushable: number;
    reportingSteps: number;
    byPlatform: { platform: string; installs: number; signedIn: number }[];
    byAppVersion: { appVersion: string; installs: number }[];
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    stickiness: number;
    events: number;
    sessions: number;
    screenViews: number;
    trailMembers: number;
    byDay: Point[];
    topScreens: { screen: string; views: number; members: number }[];
    topActions: { name: string; count: number; members: number }[];
  };
  activity: {
    days: number;
    members: number;
    steps: number;
    verifiedSteps: number;
    verifiedShare: number;
    verifiedDays: number;
    unverifiedDays: number;
    avgStepsPerMemberDay: number;
    distanceKm: number;
    activeMinutes: number;
    workouts: number;
    byDay: Point[];
  };
  economy: {
    coins: {
      earned: number;
      spent: number;
      bySource: { source: string; coins: number; rows: number }[];
      byDay: Point[];
      balance: number;
      pending: number;
      held: number;
      lifetimeEarned: number;
    };
    orders: {
      count: number;
      revenue: number;
      coinsUsed: number;
      aov: number;
      byStatus: { status: string; orders: number; revenue: number }[];
      byDay: Point[];
    };
  };
  integrity: {
    raised: number;
    open: number;
    confirmed: number;
    dismissed: number;
    hard: number;
    soft: number;
    members: number;
    byKind: { kind: string; flags: number; members: number }[];
  };
}

export interface SignupRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string | null;
  trust: Trust;
  signedUpAt: string | null;
}

// ─── GET/PUT /admin/config/steps ───────────────────────────────────────────

/** One key an operator has moved away from the code's default. */
export interface ConfigOverride {
  path: string;
  value: unknown;
  default: unknown;
}

export interface StepsConfigView {
  /** What the server is using right now, for the keys this surface owns. */
  effective: Record<string, unknown>;
  /** The same keys as the code ships them. */
  defaults: Record<string, unknown>;
  overrides: ConfigOverride[];
  updatedBy: string | null;
  updatedAt: string | null;
}

// ─── GET/PUT /admin/users/:id/config ───────────────────────────────────────

export interface NotificationPreferences {
  categories: Record<string, boolean>;
  quietHours: { enabled: boolean; start: string; end: string };
  sms: boolean;
  email: boolean;
  /** Whether the member has ever moved one of these away from the default. */
  changed: boolean;
}

export interface MemberInstallConfig {
  deviceId: string;
  platform: Platform;
  label: string;
  appVersion: string | null;
  revoked: boolean;
  signedIn: boolean;
  lastSeenAt: string | null;
  stepSync: {
    uploadedAt: string | null;
    nudgedAt: string | null;
    remindedAt: string | null;
    quietHours: number | null;
    dueForNudge: boolean;
  };
  push: {
    hasToken: boolean;
    invalidAt: string | null;
    notifications: PermissionState | null;
    canShow: boolean;
  };
  permissions: {
    activityRecognition: PermissionState | null;
    notifications: PermissionState | null;
    healthConnectReadSteps: PermissionState | null;
    batteryUnrestricted: PermissionState | null;
  };
}

export interface MemberConfig {
  account: {
    id: string;
    name: string;
    email: string;
    phone: string;
    timezone: string;
    localDay: string;
    trust: Trust;
    frozen: boolean;
    activityLevel: string | null;
  };
  steps: {
    goal: {
      current: number;
      setAt: string | null;
      recommended: number | null;
      basedOn: string | null;
      min: number;
      max: number;
      increment: number;
    };
    ceiling: { tier: string; dailySteps: number; holdHours: number | null; trustShadow: boolean };
    coins: { enabled: boolean; per1000: number; sourceCap: number; dailyCap: number };
    upload: {
      maxAgeDays: number;
      nudge: {
        enabled: boolean;
        silentAfterHours: number;
        cooldownHours: number;
        remindAfterHours: number;
        giveUpAfterDays: number;
        batch: number;
      };
      lastUploadAt: string | null;
    };
    installs: MemberInstallConfig[];
    signedIn: number;
  };
  notifications: {
    preferences: NotificationPreferences;
    quiet: { now: boolean; endsInMinutes: number };
    reachable: { installs: number; withToken: number; canShow: number; pushConfigured: boolean };
    feed: { total: number; unread: number; lastAt: string | null };
  };
}

export type NotificationTopic =
  | 'steps'
  | 'workout'
  | 'streak'
  | 'hydration'
  | 'coins'
  | 'challenge'
  | 'reward'
  | 'health'
  | 'system';

export interface MemberNotification {
  id: string;
  topic: NotificationTopic;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string | null;
  pushedAt: string | null;
  pushDeferredUntil: string | null;
  dedupeKey: string | null;
}

export interface NotifyResult {
  id: string | null;
  status: 'created' | 'duplicate' | 'suppressed';
  push: 'sent' | 'deferred' | 'no_provider' | 'category_off' | 'no_device' | 'not_permitted' | 'skipped' | 'local';
}

export interface NudgeResult {
  at: string;
  pushed: number;
  results: { deviceId: string; label: string; outcome: 'pushed' | 'no_token' | 'signed_out' | 'refused' | 'no_provider' }[];
  reminded: 'created' | 'duplicate' | 'suppressed' | 'not_sent';
}

// ─── GET /admin/users/:id/steps ────────────────────────────────────────────

export interface StepDay {
  localDay: string;
  steps: number;
  verifiedSteps: number;
  pedometerSteps: number | null;
  distanceKm: number;
  activeMinutes: number;
  calories: number;
  workouts: number;
  source: string | null;
  verified: boolean;
  plausibility: number | null;
  layers: Record<string, number | null> | null;
  flags: string[];
  hardRejects: string[];
  deviceCount: number;
  stepsCredited: number;
  goalHit: boolean;
  scoredAt: string | null;
  devices: {
    deviceId?: unknown;
    source?: unknown;
    candidate?: unknown;
    verified?: unknown;
    verifiedSteps?: unknown;
    plausibility?: unknown;
  }[];
}

export interface MemberSteps {
  window: { from: string; to: string; days: number; timezone: string };
  goal: number;
  totals: {
    steps: number;
    verifiedSteps: number;
    verifiedShare: number;
    distanceKm: number;
    activeMinutes: number;
    calories: number;
    workouts: number;
    verifiedDays: number;
    unverifiedDays: number;
    goalDays: number;
    bestDay: { localDay: string; steps: number } | null;
    averageSteps: number;
  };
  streak: { current: number; longest: number } | null;
  byDay: StepDay[];
  data: StepDay[];
}

// ─── GET /admin/users/:id/wallet and /ledger ───────────────────────────────

export interface MemberWallet {
  balance: {
    coins: number;
    pending: number;
    lifetimeEarned: number;
    lastCreditAt: string | null;
    expiresAt: string | null;
    expiryWindowDays: number;
  };
  totals: { earned: number; spent: number; rows: number; held: number; heldCount: number };
  bySource: { source: string; earned: number; spent: number; rows: number; lastAt: string | null }[];
  holds: {
    id: string;
    amount: number;
    source: string;
    title: string;
    status: 'held' | 'released' | 'voided';
    reason: string | null;
    localDay: string | null;
    releaseAfter: string | null;
    createdAt: string | null;
  }[];
  dailyCaps: {
    localDay: string;
    earned: number;
    capped: number;
    workouts: number;
    bySource: Record<string, number>;
  }[];
  rate: { dailyCap: number; sourceCaps: Record<string, number>; stepsEnabled: boolean };
}

export interface LedgerRow {
  id: string;
  amount: number;
  source: string;
  title: string;
  referenceType: string;
  referenceId: string;
  actor: string;
  holdId: string | null;
  deviceId: string | null;
  appVersion: string | null;
  createdAt: string | null;
}

// ─── GET /admin/users/:id/achievements ─────────────────────────────────────

export interface Badge {
  id: string;
  label: string;
  title: string;
  metric: string;
  value: number;
  rule: string | null;
  threshold: number | null;
  rewardCoins: number;
  rewardEnabled: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  via: string | null;
}

export interface MemberAchievements {
  summary: {
    unlocked: number;
    total: number;
    rewardsEnabled: boolean;
    coinsWaiting: number;
    challengesCompleted: number;
    challengeCoinsPaid: number;
  };
  badges: Badge[];
  challenges: {
    id: string;
    challengeId: string;
    title: string;
    cadence: string;
    period: { from: string; to: string };
    progress: number;
    goal: number;
    rewardCoins: number;
    granted: number;
    status: 'paid' | 'capped' | 'unpaid';
    ledgerId: string | null;
    completedAt: string | null;
  }[];
}

// ─── GET /admin/users/:id/orders and /admin/orders/:id ─────────────────────

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  paidWith: PaidWith;
  inCoins: InCoins | null;
  items: number;
  firstItem: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payable: number;
  coinsUsed: number;
  coinsValue: number;
  payment: { method: string | null; status: string | null; paidAt: string | null; refundedAt: string | null };
  placedAt: string | null;
  trackingRef: string | null;
  city: string | null;
}

export interface MemberOrders {
  totals: { orders: number; payable: number; coinsUsed: number; cancelled: number };
  data: OrderRow[];
  nextCursor: string | null;
}

export interface OrderDetail {
  id: string;
  number: string;
  status: OrderStatus;
  /** What this order may be shown in: a coins order has no money side. */
  paidWith: PaidWith;
  member: { id: string; name: string; email: string | null; phone: string | null };
  money: {
    currency: string;
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    payable: number;
    coinsUsed: number;
    coinsValue: number;
  };
  coupon: { code?: string; title?: string; discount?: number } | null;
  /** The coin figures of a coins-only order: these *are* the price. */
  inCoins: InCoins | null;
  payment: {
    provider: string | null;
    method: string | null;
    status: string | null;
    amount: number;
    providerOrderId: string | null;
    providerPaymentId: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    refundedAt: string | null;
  };
  items: {
    itemId: string;
    title: string;
    emoji: string | null;
    image: string | null;
    quantity: number;
    size: string | null;
    color: string | null;
    price: number;
    mrp: number | null;
    coinPrice: number;
    coinsUsed: number;
    coinsValue: number;
    moneyPaid: number;
  }[];
  address: Record<string, unknown> | null;
  delivery: Record<string, unknown> | null;
  estimatedDelivery: { from?: string; to?: string } | null;
  trackingRef: string | null;
  notes: string | null;
  events: { from: string | null; to: string; actor: string; at: string | null }[];
  ledger: { paidWithCoins: string | null; refunded: string | null };
  placedAt: string | null;
  createdAt: string | null;
}

// ─── Status, adjustments and the receipt ───────────────────────────────────

export interface MemberStatus {
  frozen: boolean;
  legalHold: boolean;
  deletion: { scheduledAt: string | null; purgeAt: string | null; reason: string | null };
}

export interface AdjustResult {
  direction: 'credit' | 'clawback';
  amount: number;
  ledgerId: string | null;
  balance: number;
}

export interface AuditRow {
  id: string;
  action: string;
  actorType: string;
  actorId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  at: string | null;
}

// ─── How an order was paid for (RULES R11) ─────────────────────────────────

/** `coins` is an order with no money side at all — never show it rupees. */
export type PaidWith = 'coins' | 'money' | 'mixed';

/** The coin figures of a coins-only order: these *are* the price. */
export interface InCoins {
  goods: number;
  discount: number;
  shipping: number;
  total: number;
}

// ─── GET /admin/orders ─────────────────────────────────────────────────────

export interface OrderQueueRow {
  id: string;
  number: string;
  status: OrderStatus;
  member: { id: string; name: string; email: string | null; phone: string | null };
  items: number;
  firstItem: string | null;
  total: number;
  payable: number;
  coinsUsed: number;
  coinsValue: number;
  inCoins: InCoins | null;
  payment: { method: string | null; status: string | null; paidAt: string | null };
  trackingRef: string | null;
  city: string | null;
  placedAt: string | null;
}

export interface OrderQueue {
  total: number;
  offset: number;
  limit: number;
  totals: { orders: number; payable: number; coinsUsed: number };
  byStatus: { status: OrderStatus; orders: number }[];
  data: OrderQueueRow[];
}

export interface AdvanceResult {
  id: string;
  status: OrderStatus;
  trackingRef: string | null;
  moved: boolean;
}

export interface CancelResult {
  id: string;
  status: string;
  already: boolean;
  coinsReturned: number;
  balance: number;
  payment: string;
}

export interface RefundResult {
  id: string;
  status: 'refunded';
  coinsReturned: number;
  balance: number;
  money: 'refunded' | 'failed' | 'none';
  amount: number;
}

// ─── GET/POST/PUT/DELETE /admin/shop/items ─────────────────────────────────

export interface CatalogueItem {
  id: string;
  title: string;
  description: string;
  /** Paise. */
  price: number;
  mrp: number | null;
  /** What it costs when coins pay all of it: the figure somebody set, or the price rounded up as the till does. */
  coinPrice: number;
  /** Whether that figure was typed on the item rather than divided out of the price. */
  coinPriceSet: boolean;
  category: string;
  subcategory: string | null;
  /** Its own mode, or null to follow the shop's. */
  paymentMode: PaidWith | null;
  effectivePaymentMode: PaidWith;
  emoji: string | null;
  imageUrl: string | null;
  images: string[];
  badge: string | null;
  ribbon: string | null;
  isDeal: boolean;
  featured: boolean;
  tags: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  highlights: { icon?: string; label: string; value: string }[];
  features: { icon?: string; title: string; caption: string }[];
  specs: { icon?: string; label: string; value: string }[];
  popularity: number;
  rating: { average: number; count: number };
  stock: { onHand: number; lowStockAt: number; low: boolean; out: boolean };
  sold: { orders: number; units: number };
  active: boolean;
  sort: number;
  listedAt: string | null;
  updatedAt: string | null;
}

export interface ShopSettings {
  paymentMode: PaidWith;
  coinValuePaise: number;
  coinShareMin: number;
  coinShareMax: number;
  currency: string;
}

export interface Catalogue {
  total: number;
  offset: number;
  limit: number;
  shop: ShopSettings;
  data: CatalogueItem[];
}

export interface CatalogueItemResult {
  created?: boolean;
  shop: ShopSettings;
  item: CatalogueItem;
}

// ─── Badges by hand, and broadcasts ────────────────────────────────────────

export interface GrantBadgeResult {
  achievementId: string;
  label: string;
  granted: boolean;
  already: boolean;
  unlockedAt: string | null;
  via: string | null;
  rewardCoins: number;
  paid?: boolean;
}

export interface BroadcastPreview {
  matched: number;
  overflow: boolean;
  ceiling: number;
  sample: string[];
}

export interface BroadcastResult {
  id: string;
  recipients: number;
  created: number;
  duplicate: number;
  suppressed: number;
  pushed: number;
  deferred: number;
  notPushed: number;
  tookMs: number;
}

// ─── GET /admin/shop/items/:id/insight ─────────────────────────────────────

/** One member, as every shop read names them. */
export interface ShopMember {
  id: string;
  name: string;
  email: string | null;
}

export interface ItemInsight {
  shop: ShopSettings;
  item: CatalogueItem;
  /** Excludes cancelled and refunded orders. */
  sales: { orders: number; units: number; goods: number; coinsUsed: number; moneyPaid: number };
  /** Who wants it and has not bought it — the restock argument. */
  wanted: { baskets: number; basketUnits: number; wishlists: number; short: number };
  orders: {
    id: string;
    number: string;
    member: ShopMember;
    status: OrderStatus;
    quantity: number;
    price: number;
    coinsUsed: number;
    moneyPaid: number;
    size: string | null;
    color: string | null;
    placedAt: string | null;
  }[];
  reviews: {
    average: number;
    count: number;
    histogram: { rating: number; reviews: number }[];
    data: {
      id: string;
      member: ShopMember;
      authorName: string;
      rating: number;
      title: string | null;
      body: string;
      verified: boolean;
      createdAt: string | null;
    }[];
  };
  trail: {
    id: string;
    action: string;
    actorId: string | null;
    before: unknown;
    after: unknown;
    at: string | null;
  }[];
}

export interface ItemDeleteResult {
  deleted: true;
  id: string;
  basketsTidied: number;
  savesRemoved: number;
  reviewsRemoved: number;
}

// ─── GET /admin/shop/categories ────────────────────────────────────────────

/** The figures a shelf is measured by, whether it is a category or a subcategory. */
export interface ShelfMeasure {
  items: number;
  active: number;
  retired: number;
  outOfStock: number;
  lowStock: number;
  onHandUnits: number;
  /** Paise of stock on the shelf, at selling price. */
  stockValue: number;
  unitsSold: number;
  /** Paise of goods sold, at the price each order charged. */
  goodsSold: number;
  coinsUsed: number;
  moneyPaid: number;
  /** Saves plus basket units: wanted, and not an order yet. */
  wanted: number;
  rating: { average: number; count: number };
}

export interface ShopSubcategory extends ShelfMeasure {
  name: string;
  sort: number;
  /** A retired subcategory is off the app's chips; its items stay where they are. */
  subActive: boolean;
}

export interface ShopCategory extends ShelfMeasure {
  /** The slug every item carries, and what a filter link sends. */
  category: string;
  /** What a member reads — "Clothes" over `clothing`. */
  name: string;
  description: string;
  /** The glyph the app draws the shelf with. */
  icon: string;
  sort: number;
  /** A retired shelf is off the app altogether. */
  shelfActive: boolean;
  subcategories: ShopSubcategory[];
  unfiled: number;
}

export interface Categories {
  /** The glyphs a shelf may be drawn with, as the API offers them. */
  icons: string[];
  shop: ShopSettings;
  totals: ShelfMeasure;
  data: ShopCategory[];
}

export interface CategoryResult extends Categories {
  created?: boolean;
  slug?: string;
}

export interface CategoryDeleteResult extends Categories {
  deleted: true;
  /** Items that changed shelf as it went, each one unfiled. */
  moved: number;
  movedTo: string | null;
}

export interface SubcategoryResult extends Categories {
  moved: number;
  /** Set when the new name already had items: it was a merge, not a rename. */
  mergedWith: number | null;
}

/** `updateSubcategory`: the merge is reported by name, since the row it merged into is the answer. */
export interface SubcategoryEditResult extends Categories {
  moved: number;
  mergedWith: string | null;
}

export interface SubcategoryDeleteResult extends Categories {
  deleted: true;
  moved: number;
  reassignedTo: string | null;
}

export interface RecategoriseResult extends Categories {
  moved: number;
  missing: string[];
}

// ─── GET/POST/PUT/DELETE /admin/shop/coupons ───────────────────────────────

export type CouponState = 'live' | 'scheduled' | 'expired' | 'exhausted' | 'inactive';

export interface Coupon {
  code: string;
  title: string;
  kind: 'percent' | 'flat';
  /** 1–100 for a percent coupon; paise for a flat one. */
  value: number;
  maxDiscount: number | null;
  minSubtotal: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  redemptions: number;
  remaining: number | null;
  perUserLimit: number;
  active: boolean;
  state: CouponState;
  /** Paise the orders holding it actually took off. */
  given: number;
  orders: number;
  goods: number;
  cancelledOrders: number;
  /** It may be deleted rather than retired: nothing ever used it. */
  deletable: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CouponShop {
  couponsEnabled: boolean;
  paymentMode: PaidWith;
  coinValuePaise: number;
  currency: string;
}

export interface Coupons {
  total: number;
  offset: number;
  limit: number;
  shop: CouponShop;
  totals: { coupons: number; redemptions: number; given: number };
  data: Coupon[];
}

export interface CouponDetail {
  created?: boolean;
  shop: CouponShop;
  coupon: Coupon;
  usage: { member: ShopMember; count: number; atLimit: boolean; lastAt: string | null }[];
  orders: {
    id: string;
    number: string;
    member: ShopMember;
    status: OrderStatus;
    subtotal: number;
    total: number;
    discount: number;
    placedAt: string | null;
  }[];
}

export interface CouponDeleteResult {
  deleted: true;
  code: string;
  basketsCleared: number;
}

// ─── GET /admin/shop/baskets, /admin/shop/demand ───────────────────────────

export interface BasketShop {
  paymentMode: PaidWith;
  coinValuePaise: number;
  currency: string;
  couponsEnabled: boolean;
}

export interface BasketRow {
  member: { id: string; name: string; email: string | null; phone: string | null };
  lines: number;
  units: number;
  /** Paise, at today's prices — a basket holds references, not snapshots. */
  value: number;
  couponCode: string | null;
  /** Lines short of stock: kept by their basket, refused at checkout. */
  blocked: number;
  /** Lines whose item is off the shelf; their next basket open drops these. */
  offShelf: number;
  titles: string[];
  updatedAt: string | null;
  createdAt: string | null;
  stale: boolean;
  lastOrderAt: string | null;
  orderedSince: boolean;
}

export interface Baskets {
  total: number;
  offset: number;
  limit: number;
  shop: BasketShop;
  totals: { baskets: number; units: number; value: number; blocked: number; offShelf: number; staleDays: number };
  data: BasketRow[];
}

export interface BasketLine {
  itemId: string;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  category: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
  lineTotal: number;
  coinPrice: number;
  paymentMode: PaidWith | null;
  effectivePaymentMode: PaidWith;
  onHand: number;
  /** Why a checkout would refuse this line, or null where it would not. */
  problem: string | null;
  /** Their own basket draws this line. */
  visibleToMember: boolean;
  addedAt: string | null;
}

export interface BasketDetail {
  member: { id: string; name: string; email: string | null; phone: string | null };
  shop: BasketShop;
  basket: {
    lines: BasketLine[];
    units: number;
    value: number;
    couponCode: string | null;
    /** Lines a checkout would refuse and that will still be there next time. */
    blocked: number;
    /** Lines pointing at an item off the shelf, which the read has just dropped. */
    offShelf: number;
    updatedAt: string | null;
  };
  /**
   * The quote on their screen — the same call the app makes, so the coupon
   * as applied and its problem text are exactly what they are reading. A
   * subset of the API's quote: the fields a basket panel draws.
   */
  quote: {
    currency: string;
    paymentMode: PaidWith;
    mrpTotal: number;
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    payable: number;
    coinValuePaise: number;
    coinsMin: number;
    coinsMax: number;
    coinsShort: number;
    coinsApplied: number;
    coinsValue: number;
    coupon: { code: string; title: string; discount: number; problem: string | null } | null;
    inCoins: { goods: number; discount: number; shipping: number; total: number } | null;
  };
  wishlist: {
    itemId: string;
    title: string;
    emoji: string | null;
    imageUrl: string | null;
    price: number;
    onHand: number;
    active: boolean;
    buyable: boolean;
    addedAt: string | null;
  }[];
}

export interface DemandRow {
  itemId: string;
  title: string;
  emoji: string | null;
  category: string | null;
  price: number;
  active: boolean;
  saved: number;
  inBaskets: number;
  units: number;
  onHand: number;
  low: boolean;
  out: boolean;
  wanted: number;
  short: number;
}

export interface Demand {
  total: number;
  offset: number;
  limit: number;
  data: DemandRow[];
}

// ─── GET/DELETE /admin/shop/reviews ────────────────────────────────────────

export interface ReviewRow {
  id: string;
  item: { id: string; title: string; emoji: string | null; active: boolean; rating: { average: number; count: number } };
  member: ShopMember;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  /** They had bought it when they wrote this. Set once, never revisited. */
  verified: boolean;
  /** They hold an order for it now — which a refund can change. */
  stillHoldsAnOrder: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Reviews {
  total: number;
  offset: number;
  limit: number;
  summary: { reviews: number; average: number; histogram: { rating: number; reviews: number }[] };
  data: ReviewRow[];
}

export interface ReviewDeleteResult {
  deleted: true;
  id: string;
  itemId: string;
  rating: { average: number; count: number };
}

// ─── GET /admin/notifications ──────────────────────────────────────────────

export type NotificationCategory = 'activity' | 'reward' | 'system';

export interface NotificationRow {
  id: string;
  member: ShopMember;
  topic: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  pushedAt: string | null;
  pushDeferredUntil: string | null;
  /** A push still waiting for the quiet window to end. */
  pushPending: boolean;
  /** A broadcast stamps one key on every row it writes. */
  dedupeKey: string | null;
  createdAt: string | null;
}

export interface Notifications {
  total: number;
  offset: number;
  limit: number;
  window: { days: number; from: string | null };
  totals: { sent: number; read: number; unread: number; pushed: number; deferred: number; notPushed: number };
  byTopic: { topic: string; category: NotificationCategory; sent: number; read: number }[];
  byDay: { day: string; sent: number }[];
  data: NotificationRow[];
}

export interface NotificationDeleteResult {
  deleted: true;
  id: string;
  userId: string;
  wasRead: boolean;
  wasPushed: boolean;
  cancelledPush: boolean;
}

export interface BroadcastRow {
  id: string;
  at: string | null;
  actorId: string | null;
  topic: string;
  title: string;
  message: string;
  segment: Record<string, unknown>;
  reason: string | null;
  /** What the send itself reported, at the time. */
  sent: {
    recipients: number;
    created: number;
    duplicate: number;
    suppressed: number;
    pushed: number;
    deferred: number;
    notPushed: number;
  };
  /** And what is true now. */
  live: { rows: number; read: number; pushed: number; pending: number; openRate: number };
  /** Rows nobody has opened — what a retraction could still remove. */
  retractable: number;
}

export interface Broadcasts {
  data: BroadcastRow[];
}

export interface RetractResult {
  retracted: true;
  dedupeKey: string;
  removed: number;
  leftBecauseRead: number;
  alreadyPushed: number;
}

// ─── GET /admin/support/tickets ────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketRow {
  id: string;
  reference: string;
  subject: string;
  category: string;
  status: TicketStatus;
  member: { id: string; name: string; email: string | null; phone: string | null };
  messages: number;
  lastFrom: 'user' | 'support';
  lastMessage: string;
  lastAt: string | null;
  /** Their word was the last one: this is ours to answer. */
  waitingOnUs: boolean;
  waitingHours: number;
  platform: string | null;
  appVersion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Tickets {
  total: number;
  offset: number;
  limit: number;
  totals: { tickets: number; waitingOnUs: number; oldestWaitHours: number; oldestWaitReference: string | null };
  byStatus: { status: TicketStatus; tickets: number }[];
  byCategory: { category: string; tickets: number }[];
  data: TicketRow[];
}

export interface TicketDetail {
  ticket: {
    id: string;
    reference: string;
    subject: string;
    category: string;
    status: TicketStatus;
    messages: { id: string; from: 'user' | 'support'; body: string; createdAt: string | null }[];
    /** What the phone was running when it was opened. */
    context: { appVersion: string | null; platform: string | null; osVersion: string | null; deviceId: string | null };
    waitingOnUs: boolean;
    waitingHours: number;
    createdAt: string | null;
    updatedAt: string | null;
  };
  member: { id: string; name: string; email: string | null; phone: string | null; tier: string | null; since: string | null };
  otherTickets: { id: string; reference: string; subject: string; status: TicketStatus; createdAt: string | null }[];
  /** Set on a reply: whether the member was told, and where the push went. */
  notified?: { status: string; push: string } | null;
}

export interface TicketDeleteResult {
  deleted: true;
  id: string;
  reference: string;
}

// ─── GET /admin/support/faqs and /admin/support/guide ──────────────────────

export interface FaqRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  sort: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Faqs {
  total: number;
  offset: number;
  limit: number;
  categories: string[];
  byCategory: { category: string; articles: number; active: number }[];
  totals: { articles: number; active: number; emptyCategories: string[] };
  data: FaqRow[];
}

export interface FaqResult {
  created?: boolean;
  article: FaqRow;
}

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  icon: string;
  tint: string;
  steps: { title: string; body: string }[];
  sort: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Guide {
  /** Closed lists: the app parses both and refuses what it cannot draw. */
  icons: string[];
  tints: string[];
  totals: { sections: number; active: number; steps: number };
  data: GuideSection[];
}

export interface GuideResult extends Guide {
  created?: boolean;
}

// ─── GET/PUT /admin/config ─────────────────────────────────────────────────

export interface AppConfigSection {
  section: string;
  /** What the server is using right now. */
  effective: unknown;
  /** The same section as the code ships it. */
  defaults: unknown;
  /** Where the two have parted, key by key. */
  overrides: { path: string; value: unknown; default: unknown }[];
  /** Keys another page owns, and which page. */
  managedElsewhere: { prefix: string; by: string; why: string }[];
  /** The curated Steps config page also covers this section. */
  alsoOnStepsPage: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface AppConfigView {
  sections: AppConfigSection[];
  /** Paths that may hold null — the boxes a panel may let somebody empty. */
  nullable: string[];
  totals: { sections: number; overrides: number; changed: number };
}

// ─── One day, minute by minute (D-53, D-88) ────────────────────────────────

/** The wall-clock pieces of a minute, in the member's own zone. */
export type TimelineParts = {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
  second: number;
};

export type TimelineClaim = {
  deviceId: string;
  name: string;
  steps: number;
  timedSteps: number;
  untimedSteps: number;
  picked: boolean;
};

export type TimelineRow = {
  at: string;
  epochMs: number;
  parts: TimelineParts;
  steps: number;
  pickedDeviceId: string | null;
  rejectedSteps: number;
  overlap: boolean;
  claims: TimelineClaim[];
};

export type TimelineDevice = {
  deviceId: string;
  name: string;
  deviceSteps: number;
  countedSteps: number;
  rejectedSteps: number;
  minutesClaimed: number;
  minutesKept: boolean;
  firstSeenAt: string | null;
  counting: { from: string | null; to: string | null }[];
  rejected: boolean;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectedNote: string | null;
};

/** Contiguous minutes that agree on the phone they went to. */
export type TimelineRun = {
  from: string;
  to: string;
  fromParts: TimelineParts;
  epochMs: number;
  minutes: number;
  steps: number;
  rejectedSteps: number;
  pickedDeviceId: string | null;
  overlap: boolean;
  deviceIds: string[];
};

export type StepsTimeline = {
  userId: string;
  localDay: string;
  timezone: string;
  totals: {
    steps: number;
    rejectedSteps: number;
    minutes: number;
    overlapMinutes: number;
    devices: number;
    rejectedDevices: number;
  };
  devices: TimelineDevice[];
  withoutMinutes: string[];
  hours: {
    hour: number;
    steps: number;
    rejectedSteps: number;
    minutes: number;
    overlapMinutes: number;
    devices: (string | null)[];
  }[];
  runs: TimelineRun[];
  rows: TimelineRow[];
  truncated: boolean;
};

/** What `PUT .../devices/rejected` answers with. */
export type DayRejections = {
  localDay: string;
  devices: {
    deviceId: string;
    name: string;
    rejected: boolean;
    rejectedAt: string | null;
    rejectedBy: string | null;
    note: string | null;
  }[];
  day: { steps: number; verifiedSteps: number };
};

// ─── GET/POST/PUT/DELETE /admin/challenges (RULES C1–C5) ───────────────────

export type ChallengeState = 'live' | 'upcoming' | 'ended' | 'retired';

export interface AdminChallenge {
  /** The id every completion row keys on. Fixed once created. */
  id: string;
  title: string;
  description: string;
  emoji: string;
  metric: string;
  cadence: string;
  goal: number;
  /** What finishing it pays, in coins (D-32). */
  rewardCoins: number;
  rewardsBadge: boolean;
  badgeId: string | null;
  /** The badge's own name, so a list never shows a bare id. */
  badgeLabel: string | null;
  /** The badge it names is not there any more. */
  badgeMissing: boolean;
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
  sort: number;
  state: ChallengeState;
  completions: {
    total: number;
    members: number;
    /** Coins actually paid: the ceiling and the coins switch can make this less than the reward. */
    granted: number;
    unpaid: number;
    lastAt: string | null;
  };
  updatedAt: string | null;
}

export interface ChallengeConfig {
  achievementCoinsEnabled: boolean;
  stepCoinsEnabled: boolean;
  upcomingDays: number;
  timezone: string;
  today: string;
}

export interface Challenges {
  metrics: string[];
  cadences: string[];
  config: ChallengeConfig;
  totals: {
    challenges: number;
    live: number;
    upcoming: number;
    retired: number;
    completions: number;
    granted: number;
    unpaid: number;
  };
  data: AdminChallenge[];
}

export interface ChallengeResult {
  created?: boolean;
  config: ChallengeConfig;
  challenge: AdminChallenge;
}

export interface ChallengeDeleteResult extends Challenges {
  deleted: true;
  id: string;
}

// ─── GET/POST/PUT/DELETE /admin/achievements (RULES C7) ────────────────────

export interface AdminAchievement {
  id: string;
  label: string;
  title: string;
  value: number;
  metric: string;
  /** What unlocks it on its own; null for one only a challenge pays. */
  rule: string | null;
  threshold: number | null;
  rewardCoins: number;
  sort: number;
  /** The challenges that pay it out. */
  awardedBy: { id: string; title: string; active: boolean }[];
  /** Nothing can unlock it: no rule, and no challenge awards it. */
  unreachable: boolean;
  members: number;
  lastAt: string | null;
  updatedAt: string | null;
}

export interface Achievements {
  metrics: string[];
  rules: string[];
  config: { achievementCoinsEnabled: boolean };
  totals: { achievements: number; unlocked: number; unreachable: number; coinsOnOffer: number };
  data: AdminAchievement[];
}

export interface AchievementResult {
  created?: boolean;
  config: { achievementCoinsEnabled: boolean };
  achievement: AdminAchievement;
}

export interface AchievementDeleteResult extends Achievements {
  deleted: true;
  id: string;
}

// ─── GET/POST/PUT/DELETE /admin/foods (RULES N8, N11) ──────────────────────

export interface AdminFood {
  id: string;
  name: string;
  portion: string;
  emoji: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG: number;
  /** One of the add-meal screen's shortcut tiles. */
  quickAdd: boolean;
  sort: number;
  active: boolean;
  updatedBy: string;
  updatedAt: string | null;
}

export interface FoodPage {
  data: AdminFood[];
  nextCursor: string | null;
  total: number;
}

/** What `POST /admin/foods/import` answers — the spreadsheet's result. */
export interface FoodImportResult {
  dryRun: boolean;
  created: number;
  updated: number;
  /** Rows the sheet repeated; the last one wins. */
  duplicates: number;
  failed: { line: number | null; name: string; reason: string }[];
  data: AdminFood[];
}

// ─── GET/POST/PUT/DELETE /admin/diet-plans (RULES N10) ─────────────────────

export interface AdminPlanItem {
  name: string;
  quantity: string;
}

export interface AdminPlanMeal {
  id?: string;
  slot: string;
  /** 24-hour `HH:mm`, in the member's own local time. */
  time: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  items: AdminPlanItem[];
}

export interface AdminPlanDay {
  label: string;
  meals: AdminPlanMeal[];
}

export interface AdminPlan {
  id: string;
  name: string;
  description: string;
  emoji: string;
  dietTypes: string[];
  mealPlans: string[];
  days: AdminPlanDay[];
  active: boolean;
  sort: number;
  updatedBy: string;
  updatedAt: string | null;
}

// ─── GET /admin/nutrition/overview (RULES N4) ──────────────────────────────

export interface NutritionOverview {
  foods: { total: number; active: number; retired: number; quickAdd: number; custom: number };
  plans: {
    total: number;
    active: number;
    /** Members who picked a plan by hand; the rest take the server's choice (N10). */
    chosen: number;
    serverChoice: number;
    data: { id: string; name: string; active: boolean; days: number; members: number }[];
  };
  members: {
    profiles: number;
    logging: number;
    entries: number;
    dietTypes: { value: string; members: number }[];
    mealPlans: { value: string; members: number }[];
    goals: { value: string; members: number; averageCalories: number }[];
  };
  /** ⚙ `nutrition.*`: what a member starts with, and the limits on logging. */
  defaults: {
    defaultGoals: { calories: number; proteinG: number; carbsG: number; fatsG: number };
    defaultPreferences: { dietType: string; mealPlan: string; goal: string };
    maxEntriesPerSave: number;
    maxAgeDays: number;
    searchLimit: number;
    libraryPageSize: number;
  };
}

// ─── GET/POST/PUT/DELETE /admin/training ───────────────────────────────────

export interface AdminExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  /** Cardio work is timed; a lift is counted in reps. */
  isTimed: boolean;
  imageUrl: string | null;
  /** The templates that include it. */
  templates: { id: string; title: string }[];
  /** Sets members have logged of it. */
  logged: { sessions: number; members: number; lastAt: string | null };
}

export interface AdminWorkoutTemplate {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  muscleGroups: string[];
  exerciseIds: string[];
  /** Each one's name, in the order they are performed. */
  exercises: { id: string; name: string | null }[];
  /** Ids no exercise answers to — the app drops a template holding one. */
  missing: string[];
  sort: number;
}

export interface Training {
  muscleGroups: string[];
  equipment: string[];
  totals: { exercises: number; templates: number; broken: number; unused: number; sessions: number };
  exercises: AdminExercise[];
  templates: AdminWorkoutTemplate[];
}

export interface TrainingResult extends Training {
  created?: boolean;
  deleted?: true;
  id?: string;
}
