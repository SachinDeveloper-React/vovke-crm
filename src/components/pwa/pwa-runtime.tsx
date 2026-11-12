'use client';

import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { useColorScheme } from '@mui/material/styles';

import { forgetInstallPrompt, keepInstallPrompt } from './install-store';

/**
 * Set by the Reload button. `controllerchange` also fires on the very first
 * visit, when the new worker claims the page — reloading then would be a
 * flash for nothing, so only a change somebody asked for reloads.
 */
let reloadRequested = false;

/** The browser's toolbar colour in each scheme: the page's own background. */
const CHROME = { light: '#ffffff', dark: '#141A21' } as const;

/**
 * Everything the panel does as an installed app, mounted once in the root
 * layout:
 *
 *   - registers `/sw.js` (production only — in `next dev` a caching worker
 *     would serve yesterday's bundle against today's code, so any worker a
 *     production build left behind is removed instead);
 *   - when a new build's worker is waiting, says so and reloads on request,
 *     rather than swapping code under a half-filled form;
 *   - says when the browser is offline, because every figure here is live;
 *   - keeps the install offer for the header's Install button;
 *   - keeps the browser's toolbar colour in step with the panel's own
 *     light/dark switch rather than with the OS.
 */
export function PwaRuntime() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === 'system' ? systemMode : mode) ?? 'light';

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', CHROME[scheme]);
  }, [scheme]);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    const installed = () => forgetInstallPrompt();
    window.addEventListener('beforeinstallprompt', keepInstallPrompt);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
      window.removeEventListener('beforeinstallprompt', keepInstallPrompt);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(all => all.forEach(one => one.unregister()));
      caches?.keys().then(names => names.filter(name => name.startsWith('vokve-')).forEach(name => caches.delete(name)));
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    const onControllerChange = () => {
      if (!reloadRequested) return;
      reloadRequested = false;
      window.location.reload();
    };
    const watch = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        // `installed` with a controller already in charge = an update, not the first install.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
      });
    };
    const check = () => {
      if (document.visibilityState === 'visible') registration?.update().catch(() => undefined);
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(reg => {
        registration = reg;
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        watch(reg.installing);
        reg.addEventListener('updatefound', () => watch(reg.installing));
      })
      .catch(() => undefined);

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', check);
    const hourly = window.setInterval(check, 60 * 60 * 1000);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(hourly);
    };
  }, []);

  return (
    <>
      <Snackbar open={offline} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" variant="filled" sx={{ width: '100%' }}>
          You’re offline. Nothing on screen is updating, and a save will fail until the connection is back.
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(waiting) && !offline} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert
          severity="info"
          variant="filled"
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={() => {
                reloadRequested = true;
                waiting?.postMessage({ type: 'SKIP_WAITING' });
              }}>
              Reload
            </Button>
          }
        >
          A new version of the panel is ready.
        </Alert>
      </Snackbar>
    </>
  );
}
