import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Vercel's build environment has full network access to Google Fonts,
// unlike the sandboxed environment this project was originally built in
// (see git history for why a <link> tag was used instead, before this
// rebrand) — next/font/google is the correct approach here and self-hosts
// the font files at build time, no runtime request to Google needed.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HiG EDUCAMPUS LMS",
    template: `%s | HiG EDUCAMPUS LMS`,
  },
  description: "HiG EDUCAMPUS Student Learning Management Portal",
  applicationName: "HiG EDUCAMPUS LMS",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // This is an internal institutional portal, not a public site — several
  // pages (certificate verification especially) show real people's names.
  // robots.txt already blocks crawling; this meta tag is defense-in-depth
  // in case a deployment ever serves a different robots.txt.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="bg-parchment-50 font-sans text-ink-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
