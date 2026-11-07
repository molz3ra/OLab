import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OLAB — O outro lado da sua oferta',
  description:
    'OLAB — Um laboratório para questionar sua oferta, encontrar objeções e reduzir o atrito antes de investir em tráfego.',
  icons: {
    icon: '/favicon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#faf9f6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/ibm-plex-mono-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var theme = "light";
                try {
                  var pref = localStorage.getItem("olab_theme") || "system";
                  theme =
                    pref === "dark" ||
                    (pref !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
                      ? "dark"
                      : "light";
                } catch (e) {}
                document.documentElement.dataset.theme = theme;
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
