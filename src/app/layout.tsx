import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PonteNext Management Portal",
  description: "Portale gestionale amministrativo per Ponte Next.",
  icons: {
    icon: "/brand/ponte-next-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
