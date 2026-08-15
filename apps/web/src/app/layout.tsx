import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Job Agent",
  description: "Personal job application agent — dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-gray-200 px-8 py-3 flex gap-6 text-sm font-medium">
          <Link href="/">Profile</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/applications">Applications</Link>
          <Link href="/analytics">Analytics</Link>
          <Link href="/outreach">Outreach</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
