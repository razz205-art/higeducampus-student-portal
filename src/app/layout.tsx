import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // This is an internal institutional portal, not a public site — several
  // pages (certificate verification especially) show real people's names.
  // robots.txt already blocks crawling; this meta tag is defense-in-depth
  // in case a deployment ever serves a different robots.txt.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          eslint-disable-next-line @next/next/no-page-custom-font --
          Intentional: next/font/google would make `next build` depend on
          outbound network access to fetch font files, which is risky in
          locked-down enterprise CI. This tag only needs the *browser* to
          reach Google Fonts at runtime, and never blocks a build.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-parchment-50 font-sans text-ink-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
