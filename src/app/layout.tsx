import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "NTAPattern — Online Exam Portal";
const siteDescription =
  "NTAPattern gives you a real simulation of the NTA (National Testing Agency) exam style used for JEE & NEET. Take timed multiple-choice tests, get instant results with negative marking, and track your performance.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: siteName,
    template: "%s | NTAPattern",
  },
  description: siteDescription,
  keywords: [
    "NEET mock test",
    "JEE mock test",
    "online exam portal",
    "MCQ test",
    "timed test",
    "exam preparation",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
