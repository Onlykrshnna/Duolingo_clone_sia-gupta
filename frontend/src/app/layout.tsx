import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import ClientBootstrap from "@/components/ClientBootstrap";
import PreferencesHydrator from "@/components/PreferencesHydrator";
import PageTransition from "@/components/layout/PageTransition";
import CelebrationHost from "@/components/effects/CelebrationHost";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Duolingo - The fun, effective way to learn languages",
  description: "Learn Spanish, French, and more with game-like lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <ClientBootstrap />
        <PreferencesHydrator />
        <PageTransition>{children}</PageTransition>
        <CelebrationHost />
        <ToasterProvider />
      </body>
    </html>
  );
}

