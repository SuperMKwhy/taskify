import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/Toaster";
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
  title: {
    default: "Taskify",
    template: "%s · Taskify",
  },
  description:
    "A spatial task board. Tasks float as glass cards, drift toward Pending or Finished, and cluster by project.",
  applicationName: "Taskify",
  openGraph: {
    title: "Taskify",
    description: "A spatial task board where your tasks float, drift and cluster.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121327",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
