import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivySVMProvider } from "@/components/providers/PrivySVMProvider";
import { SolanaKitProvider } from "@/components/providers/SolanaKitProvider";
import { MainHeader } from "@/components/mainHeader/MainHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paper3",
  description: "Tokenize your intellectual property on Solana",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <PrivySVMProvider>
          <SolanaKitProvider>
            <MainHeader />
            <main className="p-6">{children}</main>
          </SolanaKitProvider>
        </PrivySVMProvider>
      </body>
    </html>
  );
}
