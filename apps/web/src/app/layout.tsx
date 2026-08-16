import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "../components/Navigation";
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
        <Navigation />
        <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-950/20">
          {children}
        </div>
      </body>
    </html>
  );
}
