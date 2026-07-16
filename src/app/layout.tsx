import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KM Claim OS",
  description:
    "Project-memory case management for Hong Kong construction arbitration and adjudication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
