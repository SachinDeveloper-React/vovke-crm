/**
 * What vouches for a phone's signing key, in an operator's words.
 *
 * Android phones prove a Keystore key with Google's key attestation and send
 * a Play Integrity verdict now and then; iPhones (react-native-step-tracker-
 * pro-ios) prove a Secure Enclave key with Apple's App Attest (D-104). The
 * records and the device documents name these by code; support reads them
 * here.
 */

export type LabelTone = 'success' | 'warning' | 'error' | 'default' | 'info';

const PROVIDERS: Record<string, string> = {
  key_attestation: 'Google key attestation',
  app_attest: 'Apple App Attest',
  play_integrity: 'Play Integrity',
};

export function providerLabel(provider: string | null | undefined): string {
  if (!provider) return '—';
  return PROVIDERS[provider] ?? provider;
}

/** Why a key was kept unattested or refused — the question support is asked. */
const FAILURES: Record<string, string> = {
  // Android key attestation.
  key_mismatch: 'The key sent is not the key its certificate names.',
  challenge_mismatch: 'Made for another challenge — a replay.',
  chain_invalid: 'A certificate in the chain is not signed by the next.',
  untrusted_root: 'The chain does not end in Google’s root — the phone could not attest.',
  expired: 'A certificate in the chain has expired.',
  revoked: 'Google has revoked a certificate in the chain.',
  no_extension: 'The certificate carries no attestation.',
  wrong_package: 'Attested for another app.',
  wrong_signer: 'Signed by another release key — a repackaged app.',
  // Apple App Attest.
  app_attest_unavailable: 'This iPhone cannot attest — a simulator, or a device App Attest does not support.',
  app_attest_not_configured: 'The server has no Apple team id, so nothing could be checked.',
  malformed: 'The attestation could not be read.',
  nonce_mismatch: 'Apple’s certificate does not carry this attestation’s nonce.',
  wrong_app: 'Attested for another app or team.',
  not_new: 'An App Attest key that had been used before.',
  wrong_environment: 'From an App Attest environment this server does not accept.',
};

export function failureText(failure: string | null | undefined): string | null {
  if (!failure) return null;
  return FAILURES[failure] ?? failure.replace(/_/g, ' ');
}

/** The colour a recorded verdict reads in. */
export function verdictTone(verdict: string | null | undefined): LabelTone {
  switch (verdict) {
    case 'attested':
    case 'pass':
    case 'verified':
      return 'success';
    case 'unattested':
    case 'unavailable':
      return 'warning';
    case 'refused':
    case 'fail':
      return 'error';
    default:
      return 'default';
  }
}

/** Android's boot state, which App Attest has no equivalent of. */
export function bootStateTone(state: string | null | undefined, locked: boolean | null | undefined): LabelTone {
  if (state === 'verified' && locked !== false) return 'success';
  if (!state || state === 'unknown') return 'default';
  return 'error';
}
