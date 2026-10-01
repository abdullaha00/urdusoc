import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  EB_Garamond,
  Gulzar,
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  Libre_Caslon_Text,
  Manrope,
  Newsreader,
  Noto_Nastaliq_Urdu,
  Source_Sans_3,
} from "next/font/google";
import { FontThemeSwitcher } from "@/components/font-theme-switcher";
import { NameFontSwitcher } from "@/components/name-font-switcher";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { society } from "@/lib/content";
import { env } from "@/lib/env";
import { SITE_PALETTE } from "@/lib/palette";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  preload: false,
});

const gulzar = Gulzar({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-gulzar",
  display: "swap",
  preload: false,
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-noto-nastaliq",
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
  preload: false,
});

const libreCaslon = Libre_Caslon_Text({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre-caslon",
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

const fontVariables = [
  newsreader.variable,
  sourceSans.variable,
  gulzar.variable,
  ebGaramond.variable,
  inter.variable,
  notoNastaliqUrdu.variable,
  instrumentSerif.variable,
  instrumentSans.variable,
  libreCaslon.variable,
  cormorant.variable,
  manrope.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    /*
      Full name, not the abbreviation: a tab or a search result is read by
      people who do not yet know us, and nobody searches for "UrduSoc" - they
      search for the society by name. The default is the homepage title, so it
      is the bare name rather than the name twice.

      Search engines truncate titles around sixty characters and the name is
      thirty-three of them, so a long event title loses the suffix. That is the
      right thing to lose: the page's own name is the half worth keeping.
    */
    default: society.name,
    template: `%s - ${society.name}`,
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
      // Selects the colour palette - see src/lib/palette.ts to switch.
      data-palette={SITE_PALETTE}
      /*
        The shipped type pairing - Newsreader, Source Sans 3, Gulzar. The
        alternatives live in globals.css and the dev-only FontThemeSwitcher
        swaps this attribute to preview them, so this is the one place to edit
        when a different pairing wins.
      */
      data-font-theme="A"
      className={fontVariables}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {process.env.NODE_ENV === "development" ? (
          <>
            <NameFontSwitcher />
            <FontThemeSwitcher />
          </>
        ) : null}
      </body>
    </html>
  );
}
