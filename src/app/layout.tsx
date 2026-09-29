import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { society } from "@/lib/content";
import { env } from "@/lib/env";
import { SITE_PALETTE } from "@/lib/palette";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${society.name} — ${society.shortName}`,
    template: `%s — ${society.shortName}`,
  },
  description:
    "A home for Urdu language, literature and culture in Cambridge. Mushairas, conversation evenings and socials, open to everyone.",
  openGraph: {
    type: "website",
    siteName: society.name,
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Selects the colour palette — see src/lib/palette.ts to switch.
      data-palette={SITE_PALETTE}
      className={`${inter.variable} ${cormorant.variable} ${notoNastaliqUrdu.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
