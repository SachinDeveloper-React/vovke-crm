/**
 * Every knob the step pipeline has, as something to draw a form from.
 *
 * The list mirrors `admin/config.service.ts`'s schema exactly — it is the
 * closed list the API will accept, so a field that is not here cannot be
 * sent, and a field here that the API has dropped fails loudly on save
 * rather than quietly doing nothing.
 *
 * The help text is the backend's own reasoning, shortened. An operator
 * turning one of these should be able to read why it is the number it is
 * without opening the source.
 */

export type FieldKind = 'number' | 'decimal' | 'boolean' | 'select' | 'list' | 'nullableDecimal' | 'nullableBoolean';

export type ConfigField = {
  /** The dotted path the API knows it by, e.g. `activity.syncNudge.enabled`. */
  path: string;
  label: string;
  help?: string;
  kind: FieldKind;
  /** For `select`. */
  options?: { value: string; label: string }[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Shown in red: changing it has consequences that cannot be undone. */
  grave?: boolean;
};

export type ConfigGroup = {
  id: string;
  title: string;
  subtitle: string;
  note?: string;
  fields: ConfigField[];
};

export const STEPS_CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'coins',
    title: 'What a day’s walking is worth',
    subtitle: 'The rate, and the ceilings it is paid under',
    note:
      'A minted coin cannot be taken back, which is why minting is off while the shadow report is read. The per-source cap must stay at or below the daily ceiling, or the save is refused.',
    fields: [
      {
        path: 'coins.steps.enabled',
        label: 'Mint coins for verified steps',
        help: 'Off through the shadow period: days are ingested and scored, and nothing is minted. Turning this on starts paying — read the step economy page first.',
        kind: 'boolean',
        grave: true,
      },
      { path: 'coins.steps.unitSteps', label: 'Steps per unit', kind: 'number', unit: 'steps', min: 1, max: 10_000 },
      {
        path: 'coins.steps.coinsPerUnit',
        label: 'Coins per unit',
        help: 'At 0.095 per 100 steps, 10,000 steps is 9.5 coins.',
        kind: 'decimal',
        min: 0,
        max: 100,
        step: 0.005,
      },
      {
        path: 'coins.sourceCaps.steps',
        label: 'Most coins a day may mint from steps',
        help: 'Sized to the rate it caps: at 0.095 per 100 a 30,000-step day is 28.5 coins, so 30 binds just above a full day’s walk.',
        kind: 'decimal',
        unit: 'coins',
        min: 0,
      },
      {
        path: 'coins.dailyCap',
        label: 'Most coins a day may mint from everything',
        help: 'The hard per-member per-day ceiling across every source.',
        kind: 'decimal',
        unit: 'coins',
        min: 0,
      },
    ],
  },
  {
    id: 'upload',
    title: 'Reporting, and the nudges that chase it',
    subtitle: 'How long a day stays sendable, and when the server asks for it',
    note:
      'Steps are counted with the app closed but only leave the phone from the foreground, so the server asking is better than the member remembering. The silent push comes first; the member is only told after it has had time to fail — a reminder before the push would be refused on save.',
    fields: [
      {
        path: 'activity.maxAgeDays',
        label: 'A day may still be sent for',
        help: 'Past this, in the phone’s own zone, a day is refused for good. Stale evidence is weaker evidence, but too short a window throws away real walking from a phone left in a drawer.',
        kind: 'number',
        unit: 'days',
        min: 1,
        max: 60,
        grave: true,
      },
      { path: 'activity.syncNudge.enabled', label: 'Chase quiet installs at all', kind: 'boolean' },
      {
        path: 'activity.syncNudge.silentAfterHours',
        label: 'Silent “sync now” push after',
        help: 'Hours since the newest accepted snapshot. Nothing rings: no tray entry, no feed row, and quiet hours do not apply.',
        kind: 'number',
        unit: 'hours',
        min: 1,
        max: 336,
      },
      {
        path: 'activity.syncNudge.cooldownHours',
        label: 'And not again for',
        kind: 'number',
        unit: 'hours',
        min: 1,
        max: 336,
      },
      {
        path: 'activity.syncNudge.remindAfterHours',
        label: 'Tell the member in words after',
        help: 'A push can go undelivered. This rung is a message: quiet hours and the activity switch apply, and it is sent at most once a day.',
        kind: 'number',
        unit: 'hours',
        min: 1,
        max: 720,
      },
      {
        path: 'activity.syncNudge.giveUpAfterDays',
        label: 'Stop chasing after',
        help: 'A phone silent for a month has stopped being used; what is left there is a retention question.',
        kind: 'number',
        unit: 'days',
        min: 1,
        max: 365,
      },
      {
        path: 'activity.syncNudge.batch',
        label: 'Installs handled per hourly run',
        help: 'The tick takes the rest next time.',
        kind: 'number',
        min: 1,
        max: 10_000,
      },
      {
        path: 'activity.sync.intervalMinutes',
        label: 'Phone syncs today every',
        help: 'While the app is open.',
        kind: 'number',
        unit: 'minutes',
        min: 1,
        max: 240,
      },
      {
        path: 'activity.sync.minGapSeconds',
        label: 'Least gap between two unasked-for syncs',
        kind: 'number',
        unit: 'seconds',
        min: 0,
        max: 3600,
      },
    ],
  },
  {
    id: 'goal',
    title: 'The daily goal',
    subtitle: 'The range a member may set theirs in',
    note:
      'The member’s own screen enforces this range, and so does an operator setting a goal from a member’s page. Narrowing it does not move the goals already saved.',
    fields: [
      { path: 'activity.goal.min', label: 'Lowest goal', kind: 'number', unit: 'steps', min: 500, max: 50_000 },
      { path: 'activity.goal.max', label: 'Highest goal', kind: 'number', unit: 'steps', min: 1000, max: 100_000 },
      {
        path: 'activity.goal.increment',
        label: 'The − and + buttons move by',
        kind: 'number',
        unit: 'steps',
        min: 50,
        max: 5000,
      },
    ],
  },
  {
    id: 'tracker',
    title: 'What the phone is told to count',
    subtitle: 'Served to the tracker as-is, so this changes without an app release',
    fields: [
      {
        path: 'activity.tracker.healthConnectWriteEnabled',
        label: 'Write our steps into Health Connect',
        help: 'So the member’s other fitness apps see them. Only this phone’s own count goes in — never a watch’s steps read back out.',
        kind: 'boolean',
      },
      {
        path: 'activity.tracker.healthConnectWriteGranularity',
        label: 'Written as',
        kind: 'select',
        options: [
          { value: 'minute', label: 'One record a minute (Health Connect’s guidance)' },
          { value: 'day', label: 'One record a day' },
        ],
      },
      {
        path: 'activity.tracker.healthConnectIgnoreManualEntries',
        label: 'Ignore hand-typed Health Connect entries',
        kind: 'boolean',
      },
      {
        path: 'activity.tracker.wearableTrust',
        label: 'A watch is recognised by',
        kind: 'select',
        options: [
          { value: 'catalog', label: 'The tracker’s own catalogue' },
          { value: 'metadata', label: 'The record’s metadata' },
        ],
      },
      {
        path: 'activity.tracker.wearableAllowlist',
        label: 'Apps trusted as a watch’s relay',
        help: 'One package name per line. Google Fit carries Wear OS and many budget watches into Health Connect, but the catalogue files it as a phone-side app.',
        kind: 'list',
      },
      {
        path: 'activity.tracker.gapRecovery',
        label: 'Steps counted while the app was dead',
        kind: 'select',
        options: [
          { value: 'split', label: 'Split across the days they belong to' },
          { value: 'today', label: 'All onto today' },
          { value: 'today_capped', label: 'Onto today, capped' },
          { value: 'drop', label: 'Dropped' },
        ],
      },
      { path: 'activity.tracker.fraudDetection.enabled', label: 'On-phone checks', kind: 'boolean' },
      {
        path: 'activity.tracker.fraudDetection.mode',
        label: 'Those checks',
        help: 'Flag marks a day and sends it anyway; exclude removes the steps on the phone.',
        kind: 'select',
        options: [
          { value: 'flag', label: 'Flag, and still send' },
          { value: 'exclude', label: 'Exclude on the phone' },
        ],
      },
      { path: 'activity.tracker.motionSampling.enabled', label: 'Sample motion', kind: 'boolean' },
      {
        path: 'activity.tracker.motionSampling.windowSeconds',
        label: 'Each sample lasts',
        kind: 'number',
        unit: 'seconds',
        min: 1,
        max: 120,
      },
      {
        path: 'activity.tracker.motionSampling.intervalMinutes',
        label: 'Sampled every',
        kind: 'number',
        unit: 'minutes',
        min: 1,
        max: 240,
      },
      {
        path: 'activity.tracker.historyRetentionDays',
        label: 'The phone keeps history for',
        kind: 'number',
        unit: 'days',
        min: 1,
        max: 1000,
      },
      {
        path: 'activity.tracker.motionWindowRetention',
        label: 'Motion windows kept on the phone',
        help: 'At five minutes a window, 864 is three days — enough that a day which waited offline still goes up with its evidence.',
        kind: 'number',
        unit: 'windows',
        min: 1,
        max: 10_000,
      },
    ],
  },
  {
    id: 'scoring',
    title: 'What makes a day verified',
    subtitle: 'The score a day must reach, and the clocks around it',
    note: 'A day at or above the score with no hard reject is verified: it earns, and it keeps the streak.',
    fields: [
      {
        path: 'activity.verifiedMinScore',
        label: 'A day verifies at',
        kind: 'number',
        unit: '/ 100',
        min: 0,
        max: 100,
        grave: true,
      },
      {
        path: 'activity.activeMinuteSteps',
        label: 'An active minute is',
        kind: 'number',
        unit: 'steps in a minute',
        min: 1,
        max: 300,
      },
      {
        path: 'activity.futureSkewMinutes',
        label: 'A snapshot signed ahead of our clock by',
        help: 'More than this is flagged.',
        kind: 'number',
        unit: 'minutes',
        min: 0,
        max: 240,
      },
      {
        path: 'activity.rawSnapshotRetentionDays',
        label: 'The signed snapshot is kept verbatim for',
        help: 'The evidence a re-score reads. A day’s minutes, windows and records are a few hundred kilobytes.',
        kind: 'number',
        unit: 'days',
        min: 1,
        max: 400,
      },
    ],
  },
  {
    id: 'thresholds',
    title: 'What the layers refuse',
    subtitle: 'The fraud ladder, in numbers',
    note:
      'The ladder has to climb: a day is flagged before it is refused. An impossible day below the flagged one is refused on save. Every one of these is a product judgement that only weeks of real phones can settle.',
    fields: [
      {
        path: 'activity.thresholds.maxDailySteps',
        label: 'A day stops being credited above',
        kind: 'number',
        unit: 'steps',
        min: 1000,
        max: 500_000,
      },
      {
        path: 'activity.thresholds.impossibleDailySteps',
        label: 'And stops being believed above',
        help: 'A 24-hour race walker covers roughly 100,000 steps.',
        kind: 'number',
        unit: 'steps',
        min: 1000,
        max: 1_000_000,
      },
      {
        path: 'activity.thresholds.maxStepsPerMinute',
        label: 'A minute above this rejects the day',
        help: 'Elite running cadence is about 210 steps a minute, and nobody holds it for a whole minute.',
        kind: 'number',
        unit: 'steps/min',
        min: 60,
        max: 1000,
      },
      {
        path: 'activity.thresholds.unaccountedShare',
        label: 'Share of a day no minute accounts for',
        help: 'Hold the minutes, raise the total — the simplest tamper there is shows up here and nowhere else.',
        kind: 'decimal',
        min: 0.01,
        max: 1,
        step: 0.05,
      },
      {
        path: 'activity.thresholds.unaccountedShareHard',
        label: '…and the share that refuses the day',
        help: 'Empty until the shadow period says what honest phones really send: a hard reject here costs a member their streak.',
        kind: 'nullableDecimal',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        path: 'activity.thresholds.untimedShare',
        label: 'Untimed share that reads as low confidence',
        kind: 'decimal',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        path: 'activity.thresholds.suspectShareHard',
        label: 'Share the phone’s own checks flagged that rejects the day',
        kind: 'decimal',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        path: 'activity.thresholds.uncorroboratedSteps',
        label: 'Steps allowed with no evidence at all',
        help: 'No minutes, no motion windows, no allowed source. Below this the day stands — a phone that could not sample a short walk is ordinary.',
        kind: 'number',
        unit: 'steps',
        min: 0,
        max: 100_000,
      },
      {
        path: 'activity.thresholds.nightShare',
        label: 'Share between 01:00 and 05:00 that flags',
        kind: 'decimal',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        path: 'activity.thresholds.newInstallSteps',
        label: 'Steps in the first 24 h that read as farming',
        kind: 'number',
        unit: 'steps',
        min: 0,
        max: 200_000,
      },
      {
        path: 'activity.thresholds.roundTotalDays',
        label: 'Round thousands on this many of the last 7 days',
        kind: 'number',
        unit: 'days',
        min: 1,
        max: 7,
      },
      {
        path: 'activity.thresholds.clockJumpMinutes',
        label: 'A clock moved by more than',
        help: 'Logged as a jump.',
        kind: 'number',
        unit: 'minutes',
        min: 1,
        max: 1440,
      },
      { path: 'activity.thresholds.pedometerRatio.min', label: 'External ÷ phone, lowest', kind: 'decimal', min: 0, max: 5, step: 0.05 },
      { path: 'activity.thresholds.pedometerRatio.max', label: '…highest', kind: 'decimal', min: 0, max: 10, step: 0.05 },
      {
        path: 'activity.thresholds.pedometerRatio.hard',
        label: '…above which the external count is not trusted',
        kind: 'decimal',
        min: 0,
        max: 20,
        step: 0.1,
      },
      { path: 'activity.thresholds.motion.walkMinHz', label: 'Walking is between', kind: 'decimal', unit: 'Hz', min: 0, max: 20, step: 0.1 },
      { path: 'activity.thresholds.motion.walkMaxHz', label: '…and', kind: 'decimal', unit: 'Hz', min: 0, max: 20, step: 0.1 },
      { path: 'activity.thresholds.motion.shakeMinHz', label: 'Shaking starts at', kind: 'decimal', unit: 'Hz', min: 0, max: 40, step: 0.5 },
      {
        path: 'activity.thresholds.motion.nonWalkHardShare',
        label: 'Non-walk share that rejects a day',
        kind: 'decimal',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        path: 'activity.thresholds.motion.absentScore',
        label: 'The layer scores this when no motion was sent',
        help: 'Without it, switching sampling off scored better than an honest phone with a few shaken windows.',
        kind: 'number',
        unit: '/ 100',
        min: 0,
        max: 100,
      },
      { path: 'activity.thresholds.strideMeters.min', label: 'Metres per step, lowest', kind: 'decimal', min: 0.1, max: 2, step: 0.05 },
      { path: 'activity.thresholds.strideMeters.max', label: '…highest', kind: 'decimal', min: 0.1, max: 3, step: 0.05 },
    ],
  },
  {
    id: 'provenance',
    title: 'Where steps may come from',
    subtitle: 'Health Connect origins, and what to do with the rest',
    note: 'A trailing * matches a prefix — Android’s own counter writes as `android` or `com.android.healthconnect.phone.<hash>`.',
    fields: [
      { path: 'activity.provenance.allow', label: 'Counted', help: 'One package name per line.', kind: 'list' },
      {
        path: 'activity.provenance.deny',
        label: 'Never counted, and flagged',
        help: 'Known step-fabrication packages. One per line.',
        kind: 'list',
      },
      {
        path: 'activity.provenance.trustTrackerCatalog',
        label: 'Also count a source the tracker’s catalogue trusts',
        kind: 'boolean',
      },
      {
        path: 'activity.provenance.countUnknownMethod',
        label: 'Count steps whose recording method is unstated',
        help: 'Off: unknown is unverified.',
        kind: 'boolean',
      },
      {
        path: 'activity.inspector.showChecks',
        label: 'Show the layers’ scores in the app’s own source report',
        help: 'They tell a cheater exactly which check caught them. Empty means “outside production only”.',
        kind: 'nullableBoolean',
        options: [
          { value: '', label: 'Outside production only' },
          { value: 'true', label: 'Always show' },
          { value: 'false', label: 'Never show' },
        ],
      },
    ],
  },
  {
    id: 'trust',
    title: 'Trust tiers',
    subtitle: 'What each tier lets through, and how long its coins wait',
    note:
      'The tier is computed from the score; these are what it then decides. In shadow, both are computed and neither is enforced.',
    fields: [
      { path: 'trust.shadow', label: 'Shadow mode (compute, never enforce)', kind: 'boolean', grave: true },
      { path: 'trust.stepCaps.trusted', label: 'Daily step ceiling · trusted', kind: 'number', unit: 'steps', min: 0 },
      { path: 'trust.stepCaps.normal', label: '· normal', kind: 'number', unit: 'steps', min: 0 },
      { path: 'trust.stepCaps.watch', label: '· watch', kind: 'number', unit: 'steps', min: 0 },
      { path: 'trust.stepCaps.restricted', label: '· restricted', kind: 'number', unit: 'steps', min: 0 },
      { path: 'trust.stepCaps.banned', label: '· banned', kind: 'number', unit: 'steps', min: 0 },
      {
        path: 'trust.holdHours.trusted',
        label: 'Step coins wait · trusted',
        help: 'The escrow window: coins are held this long before they can be spent.',
        kind: 'number',
        unit: 'hours',
        min: 0,
      },
      { path: 'trust.holdHours.normal', label: '· normal', kind: 'number', unit: 'hours', min: 0 },
      { path: 'trust.holdHours.watch', label: '· watch', kind: 'number', unit: 'hours', min: 0 },
      {
        path: 'trust.holdHours.restricted',
        label: '· restricted',
        help: 'Empty means never released on their own.',
        kind: 'nullableDecimal',
        unit: 'hours',
        min: 0,
      },
      { path: 'trust.tiers.trusted', label: 'Score needed for trusted', kind: 'number', unit: '/ 100', min: 0, max: 100 },
      { path: 'trust.tiers.normal', label: '· normal', kind: 'number', unit: '/ 100', min: 0, max: 100 },
      { path: 'trust.tiers.watch', label: '· watch', kind: 'number', unit: '/ 100', min: 0, max: 100 },
    ],
  },
  {
    id: 'diagnosis',
    title: 'When the diagnosis speaks up',
    subtitle: 'Where the Diagnose page draws its lines',
    note: 'These decide what counts as a problem — they change what support sees, not what a member gets.',
    fields: [
      {
        path: 'telemetry.problems.noUploadHours',
        label: 'Counting and silent for',
        help: 'Past this, an install reads as “gone quiet” on the fleet and member reads.',
        kind: 'number',
        unit: 'hours',
        min: 1,
        max: 720,
      },
      {
        path: 'telemetry.health.staleHours',
        label: 'A health report goes stale after',
        kind: 'number',
        unit: 'hours',
        min: 1,
        max: 720,
      },
      { path: 'telemetry.problems.errorDays', label: 'Faults are read back', kind: 'number', unit: 'days', min: 1, max: 90 },
      {
        path: 'telemetry.problems.errorGroupsForFinding',
        label: 'Kinds of handled error worth saying',
        kind: 'number',
        min: 1,
        max: 100,
      },
      {
        path: 'telemetry.problems.unverifiedDays',
        label: 'Unverified days counted over',
        kind: 'number',
        unit: 'days',
        min: 1,
        max: 90,
      },
    ],
  },
];

/** The value at a dotted path, for reading the effective config. */
export function at(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Record<string, unknown>)[key];
  }, source);
}

/** `{'a.b': 1}` → `{a: {b: 1}}`, the shape the API's patch schema wants. */
export function nest(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split('.');
    const leaf = keys.pop()!;
    let node = out;
    for (const key of keys) {
      node[key] = (node[key] as Record<string, unknown>) ?? {};
      node = node[key] as Record<string, unknown>;
    }
    node[leaf] = value;
  }
  return out;
}
