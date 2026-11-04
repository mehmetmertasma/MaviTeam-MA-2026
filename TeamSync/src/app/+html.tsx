import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Root HTML layout for Expo Router Web Static Rendering.
 * Sets site-wide SEO tags (Open Graph, structured data), character encoding, and preconnects.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, shrink-to-fit=no" />
        
        {/* <title>, description, canonical and robots are set per route by <Head> in _layout.tsx */}
        <meta name="theme-color" content="#2B6BFF" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="MaviTeam" />

        {/* Link previews (WhatsApp, Instagram, X, LinkedIn...) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MaviTeam" />
        <meta property="og:title" content="MaviTeam | Spor Kulübü Yönetim Platformu" />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/logo.png`} />
        <meta property="og:locale" content="tr_TR" />
        <meta name="twitter:card" content="summary" />

        {/* Tells Google that "MaviTeam" / "Mavi Team" is the name of this site */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

        {/* Preconnect to external critical origins */}
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://teamsync-29ea1.firebaseapp.com" />

        {/* Reset web scrolling for native feel */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const SITE_URL = "https://maviteam.com";
const SITE_DESCRIPTION =
  "MaviTeam, spor kulüpleri için takım yönetimi, antrenman takvimi, yoklama, aidat takibi ve mesajlaşma platformu.";

const structuredData = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MaviTeam",
    alternateName: ["Mavi Team", "maviteam"],
    url: `${SITE_URL}/`,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MaviTeam",
    alternateName: "Mavi Team",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MaviTeam",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web, Android, iOS",
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  },
]);

const globalStyles = `
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #0A0F1D;
  -webkit-font-smoothing: antialiased;
}
`;
