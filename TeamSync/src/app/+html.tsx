import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Root HTML layout for Expo Router Web Static Rendering.
 * Sets the document title, SEO meta tags, character encoding, and preconnects.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, shrink-to-fit=no" />
        
        <title>MaviTeam | Spor Kulübü Yönetim Platformu</title>
        <meta name="description" content="MaviTeam - Spor kulüpleri için profesyonel takım yönetimi, antrenman takvimi, yoklama ve mesajlaşma platformu." />
        <meta name="theme-color" content="#208AEF" />

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

const globalStyles = `
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #0A0F1D;
  -webkit-font-smoothing: antialiased;
}
`;
