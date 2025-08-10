import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { ZkLoginProvider } from "@/providers/ZkLoginProvider";
import { SuiProvider } from "@/providers/SuiProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AidChain - Transparent Donations for Social Good",
  description: "Revolutionary donation platform using blockchain transparency",
  icons: {
    icon: '/logo.svg', // Path relative to the public directory
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={figtree.className}>
        <SuiProvider><ZkLoginProvider>{children}</ZkLoginProvider></SuiProvider>
        </body>
    </html>
  );
}
