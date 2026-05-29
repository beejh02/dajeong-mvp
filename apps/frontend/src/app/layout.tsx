import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../index.css";
import "../App.css";
import "../views/AdminPage/AdminPage.css";
import "../views/KioskAPage/KioskAPage.css";
import "../views/KioskBPage/KioskBPage.css";

export const metadata: Metadata = {
  title: "Dajung Kiosk Platform",
  description: "Dajung admin and kiosk frontend",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
