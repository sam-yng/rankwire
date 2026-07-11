import type { Metadata } from "next";
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
  title: "Young Post",
  description: "Personal engineering-news aggregator",
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
