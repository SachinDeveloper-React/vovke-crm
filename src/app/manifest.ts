import type { MetadataRoute } from 'next';

/**
 * The panel as an installable app: its own window, its own icon, and the
 * four places an operator opens it for in the launcher's right-click menu.
 *
 * `start_url` is the dashboard rather than `/`: the root only redirects, and
 * an installed app that opens on a redirect flashes before it settles.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/dashboard',
    name: 'Vokve Admin',
    short_name: 'Vokve Admin',
    description: 'Members, orders, the shop, the step economy and support — the operator’s panel for Vokve.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Members', url: '/dashboard/users', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Orders', url: '/dashboard/orders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Support', url: '/dashboard/support', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Fraud queue', url: '/dashboard/fraud', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
