import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { defaultSettings, SettingsProvider } from "../components";
import { ThemeProvider, themeConfig } from "../theme";
import { headers } from "next/headers";

export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vokve Admin",
  description: "The operator's own surface: analytics, diagnosis, members, and the fraud queue.",
  // Nothing in here is for anybody but the operator.
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
    const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      dir={themeConfig.direction}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Applies the stored color scheme before paint, so dark mode does not flash. */}
        <InitColorSchemeScript
        nonce={nonce}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
          defaultMode={themeConfig.defaultMode}
          modeStorageKey={themeConfig.modeStorageKey}
          colorSchemeStorageKey={themeConfig.colorSchemeStorageKey}
        />
        <SettingsProvider settings={defaultSettings}>
          <AppRouterCacheProvider options={{nonce}}>
            <ThemeProvider >{children}</ThemeProvider>
          </AppRouterCacheProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
