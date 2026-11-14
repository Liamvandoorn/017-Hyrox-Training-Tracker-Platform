import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyrox Training Tracker",
  description: "Track your Hyrox training sessions",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Hyrox Trainer" />
        <meta name="theme-color" content="#2a2a2a" />
      </head>
      <body>{children}</body>
    </html>
  );
}
