import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NGTA Console | Angel One",
  description: "Next Gen Trading Analysis with Angel One API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen flex`}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-grow p-4 md:p-6 lg:ml-64 transition-all duration-300">
            {/* Main content wrapper with margin for Sidebar (fixed pos) */}
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
          <div className="lg:ml-64">
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
