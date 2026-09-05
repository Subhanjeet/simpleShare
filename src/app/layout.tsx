import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SimpleShare | Drop. Connect. Share.",
  description: "Share files with friends for 7 days. Automatic deletion, no account required, instant room codes and QR sharing.",
  keywords: ["file sharing", "temporary storage", "QR code share", "SimpleShare", "7 day files"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-background text-text-primary antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
