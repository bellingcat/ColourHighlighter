import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StyledComponentsRegistry from "@/lib/registry";
import { ThemeProvider } from "@/contexts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bellingcat – Colour Picker",
  description: "Tool for highlighting colors in screen captures",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Tool for highlighting colors in screen captures" />
        <meta name="keywords" content="bellingcat, colour, highlighter, tool, screen capture" />
        <meta name="author" content="Bellingcat" />
        <meta name="application-name" content="Bellingcat Colour Highlighter" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="og:title" content="Bellingcat Colour Highlighter" />
        <meta name="og:description" content="Tool for highlighting colors in screen captures" />
        <meta name="og:image" content="/og-image.png" />
        <meta name="og:url" content="https://colour.bellingcat.com" />
        <meta name="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bellingcat Colour Highlighter" />
        <meta name="twitter:description" content="Tool for highlighting colors in screen captures" />
        <meta name="twitter:image" content="/og-image.png" />
        <meta name="twitter:site" content="@bellingcat" />
        <meta name="twitter:creator" content="@bellingcat" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>        
        <StyledComponentsRegistry>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
