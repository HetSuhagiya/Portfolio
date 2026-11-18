import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './pages.css';
import { Stage } from '@/components/canvas/Stage';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { TransitionProvider } from '@/components/transition/TransitionProvider';
import { Chrome } from '@/components/chrome/Chrome';
import { ProgressRail } from '@/components/chrome/ProgressRail';
import { Cursor } from '@/components/chrome/Cursor';
import { Preloader } from '@/components/chrome/Preloader';
import { SEEN_KEY, SEEN_TTL_MS } from '@/lib/preload';
import { buildRouteMap } from '@/lib/routes';
import { JsonLdScript, personJsonLd } from '@/lib/seo';
import { site, pageSeo } from '@/content/site';
import { caseStudies } from '@/content/work';
import { validateContent } from '@/content/schema';

// Fail the build early if any content file is malformed.
validateContent();

// Self-hosted, preloaded fonts (files live in app/fonts).
const serif = localFont({
  src: [
    { path: './fonts/InstrumentSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/InstrumentSerif-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Iowan Old Style', 'Georgia', 'serif'],
});
const geist = localFont({
  src: './fonts/Geist-Variable.woff2',
  weight: '100 900',
  variable: '--font-geist',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});
const geistMono = localFont({
  src: './fonts/GeistMono-Variable.woff2',
  weight: '100 900',
  variable: '--font-geist-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'Menlo', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: pageSeo.home.title, template: `%s | ${site.name}, ${site.role}, London` },
  description: pageSeo.home.description,
  applicationName: `${site.name}, ${site.role}`,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: `${site.name}, ${site.role}`,
    title: pageSeo.home.title,
    description: pageSeo.home.description,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: pageSeo.home.title, description: pageSeo.home.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#07080B' },
    { media: '(prefers-color-scheme: light)', color: '#07080B' },
  ],
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const routes = buildRouteMap();
  const cases = caseStudies.map((c) => ({ slug: c.slug, no: c.no, short: c.short }));

  // Runs before first paint (attributes, not classes: React owns className on <html>): marks JS as available, skips the preloader on repeat visits,
  // and sets the route's theme and tint so paper pages never flash dark.
  const themes = Object.fromEntries(Object.entries(routes).map(([k, v]) => [k, [v.theme, v.tint]]));
  const boot = `(function(){var d=document.documentElement;d.setAttribute('data-js','');try{var t=+localStorage.getItem('${SEEN_KEY}');if(t&&Date.now()-t<${SEEN_TTL_MS})d.setAttribute('data-seen','')}catch(e){}var R=${JSON.stringify(themes)};var p=location.pathname.replace(/\\/$/,'')||'/';var r=R[p];d.dataset.theme=r?r[0]:'ink';if(r)d.style.setProperty('--tint',r[1]);setTimeout(function(){if(!window.__hs)d.removeAttribute('data-js')},7000)})()`;

  return (
    <html
      lang="en-GB"
      dir="ltr"
      data-theme="ink"
      className={`${serif.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only-focusable bg-paper text-ink fixed top-3 left-3 z-[200] rounded-full px-5 py-3 font-mono text-sm"
        >
          Skip to content
        </a>
        <Stage />
        <SmoothScroll />
        <TransitionProvider routes={routes}>
          <Chrome cases={cases} />
          <ProgressRail />
          <div id="page">{children}</div>
        </TransitionProvider>
        <Cursor />
        <Preloader />
        <script type="application/ld+json" dangerouslySetInnerHTML={JsonLdScript(personJsonLd())} />
      </body>
    </html>
  );
}
