import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridSearch - Google Sheets Clone with Search",
  description: "A Google Sheets/Excel clone with integrated search functionality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
