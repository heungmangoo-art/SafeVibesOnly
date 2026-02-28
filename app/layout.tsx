import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "./LocaleProvider";
import { Footer } from "./components/Footer";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeVibesOnly - Vibe-coded? Get your security score.",
  description:
    "Paste your GitHub repo URL and get a security score in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} antialiased flex flex-col h-screen overflow-hidden`}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <LocaleProvider>{children}</LocaleProvider>
        </div>
        <Footer />
      </body>
    </html>
  );
}
