import type { Metadata, Viewport } from "next";
import {
  Geist,
  JetBrains_Mono,
  Libre_Caslon_Display,
  Libre_Caslon_Text,
} from "next/font/google";
import "./globals.css";
import { Header } from "./components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const caslonDisplay = Libre_Caslon_Display({
  variable: "--font-caslon-display",
  weight: "400",
  subsets: ["latin"],
});

const caslonText = Libre_Caslon_Text({
  variable: "--font-caslon-text",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rankwire.com.au"),
  title: {
    default: "Rankwire | Personal engineering dispatch",
    template: "%s | Rankwire",
  },
  description: "A personalised engineering-news feed that learns from every vote.",
  applicationName: "Rankwire",
  authors: [{ name: "Sam Young" }],
  keywords: ["engineering news", "RSS", "personalised feed", "Next.js", "Prisma"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "/",
    siteName: "Rankwire",
    title: "Rankwire | Personal engineering dispatch",
    description: "A personalised engineering-news feed that learns from every vote.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rankwire | Personal engineering dispatch",
    description: "A personalised engineering-news feed that learns from every vote.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetBrainsMono.variable} ${caslonDisplay.variable} ${caslonText.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-fg font-sans">
        <Header />
        {children}
      </body>
    </html>
  );
}
