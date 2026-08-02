import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const heading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://karbonrota.com"),
  title: "KarbonRota — AB Sınırda Karbon Düzenleme Mekanizması (SKDM/CBAM) Hazırlık Platformu",
  description:
    "CBAM nedir, SKDM ne demek? Sınırda karbon düzenleme mekanizması kapsamında demir-çelik, alüminyum, çimento ve gübre ihracatçıları için CBAM hesaplama, gömülü emisyon takibi ve ithalatçı raporlama platformu.",
  keywords: [
    "CBAM nedir",
    "SKDM",
    "sınırda karbon düzenleme mekanizması",
    "CBAM hesaplama",
    "CBAM Türkiye",
    "gömülü emisyon hesaplama",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body
        className={`${heading.variable} ${body.variable} ${mono.variable} antialiased bg-base text-ink font-body`}
      >
        <AuthProvider>{children}</AuthProvider>
        {GA_MEASUREMENT_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
