import packageJson from '../package.json';

export const CONFIG = {
    appName: 'Vokve Admin',
    appVersion: packageJson.version,
    /**
     * Where the browser may reach the API directly. Nothing does: every admin
     * read is made server-side in `src/lib/api.ts`, because the operator's key
     * must never be in a client bundle. Kept for assets only.
     */
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? '',
    assetsDir: process.env.NEXT_PUBLIC_ASSETS_DIR ?? '',
}
