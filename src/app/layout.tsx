import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopProgress } from "@/components/top-progress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "Exams Hub — Mock Tests & Exam Preparation";
const siteDescription =
  "Exams Hub is a dedicated educational institute providing carefully designed mock tests and practice examinations based on the latest patterns of major competitive and academic exams. Practise like the real exam, perform with confidence.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: siteName,
    template: "%s | Exams Hub",
  },
  description: siteDescription,
  keywords: [
    "mock test",
    "exam preparation",
    "online exam portal",
    "MCQ test",
    "timed test",
    "competitive exam practice",
  ],
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
  },
  robots: { index: true, follow: true },
};

// Run serverless functions in Singapore to sit next to the Neon DB
// (ap-southeast-1). Cuts cross-region DB latency, the main cause of slow loads.
export const preferredRegion = "sin1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TopProgress />
        {children}
      </body>
    </html>
  );
}
