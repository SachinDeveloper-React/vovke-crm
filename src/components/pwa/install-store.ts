'use client';

/**
 * The browser's "install this app" offer, held until somebody asks for it.
 *
 * Chrome and Edge fire `beforeinstallprompt` once, early, and only the page
 * that kept the event can show the prompt later. The root layout listens
 * (`PwaRuntime`), and the header's Install button reads it from here —
 * mounted later, under the dashboard layout, so it could not have caught the
 * event itself. Safari and Firefox never fire it; the button just never shows.
 */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

export function keepInstallPrompt(event: Event): void {
  event.preventDefault();
  deferred = event as InstallPromptEvent;
  emit();
}

export function forgetInstallPrompt(): void {
  deferred = null;
  emit();
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const canInstall = (): boolean => deferred !== null;
export const canInstallOnServer = (): boolean => false;

/** Shows the browser's own prompt. It can be shown once per event. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  forgetInstallPrompt();
  await event.prompt();
  return (await event.userChoice).outcome === 'accepted';
}
