import type { Metadata } from "next";
import "./globals.css";
import "./form-styles.css";

export const metadata: Metadata = {
  title: "Open AI Story Tool",
  description: "Internal debugging tool for video story creation workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
