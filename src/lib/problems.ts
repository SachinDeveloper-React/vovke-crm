import type { Severity } from './types';

/**
 * What a fleet problem code means, in words.
 *
 * The per-member read already answers this — every finding it returns carries
 * its own title, detail and fix. The *fleet* read cannot: it is a count per
 * code across every install, so the words have to live here. They are the
 * same words, generalised from one phone to all of them, and they are kept
 * beside the severity so the list sorts the way an operator would.
 */
export const PROBLEMS: Record<string, { title: string; meaning: string; fix: string; severity: Severity }> = {
  steps_not_uploading: {
    title: 'Counting, but not reporting',
    meaning:
      'The install is signed in and no step snapshot has been accepted from it for longer than the configured window. Either nothing is being counted, or nothing is reaching us.',
    fix: 'The nudge job pushes these silently; where the push does not land, opening the app syncs at once. Days older than the ingest ceiling can never be sent.',
    severity: 'high',
  },
  tracking_service_dead: {
    title: 'The OS killed the counter',
    meaning:
      'Counting is on and no foreground service is running. The phone has stopped counting without the member doing anything.',
    fix: 'Almost always battery optimisation on an aggressive OEM. The tracking screen can open that OEM’s own battery page.',
    severity: 'high',
  },
  activity_permission_denied: {
    title: 'Step counting not allowed',
    meaning:
      'Physical activity is denied or blocked, so the counter cannot start. These phones report zero however far they walk.',
    fix: 'Denied can be asked for again in-app; blocked can only be granted in Android’s own settings.',
    severity: 'high',
  },
  sync_failing: {
    title: 'The sync itself is failing',
    meaning: 'The install’s last upload attempt failed, and days are queuing up behind it.',
    fix: 'An attestation or integrity refusal shows in the fault list rather than here — read that first.',
    severity: 'high',
  },
  battery_restricted: {
    title: 'Free to kill the counter',
    meaning:
      'Battery optimisation is on for the app on an OEM known to be aggressive. It has not died yet, but it will.',
    fix: 'Ask them to set the app to unrestricted; the tracking screen opens that page for them.',
    severity: 'medium',
  },
  health_connect_not_readable: {
    title: 'Health Connect unreadable',
    meaning:
      'Health Connect is installed but the app may not read from it, so a watch or another tracker on that phone counts for nothing.',
    fix: 'The step sources screen asks again; after two refusals Android only allows it from Health Connect’s own settings.',
    severity: 'medium',
  },
  no_push_token: {
    title: 'Cannot be reached',
    meaning:
      'No FCM token on file, so neither a notification nor the silent “sync now” ping can reach the install.',
    fix: 'An emulator or a build without Firebase does this; otherwise registration failed — look for a push fault.',
    severity: 'medium',
  },
  health_stale: {
    title: 'Gone quiet',
    meaning:
      'The install’s last verdict on itself is older than the staleness window. Nothing newer is known about that phone.',
    fix: 'Treat its figures as that old. An install that is also not uploading is out of touch rather than broken.',
    severity: 'medium',
  },
  notifications_refused: {
    title: 'Notifications refused',
    meaning: 'Notifications are denied or blocked. The silent sync still works; nothing can be said to them.',
    fix: 'Nothing to fix — it is their choice. Reach them in the app’s own notification centre instead.',
    severity: 'low',
  },
};

export function problemOf(code: string) {
  return (
    PROBLEMS[code] ?? {
      title: code.replace(/_/g, ' '),
      meaning: 'This code is newer than the panel — read the API’s own finding for it.',
      fix: '',
      severity: 'medium' as Severity,
    }
  );
}

export const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
