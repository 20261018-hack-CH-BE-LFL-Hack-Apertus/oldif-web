import type { Metadata, Viewport } from "next";
import { AppLifecycle } from "@/features/workbench/AppLifecycle";
import "@/styles/globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Oldif — Archives, with evidence",
  description:
    "Evidence-preserving archival research with Apertus. Explore original sources, live research traces and reviewable findings.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oldif",
  },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101410",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AppLifecycle />
      </body>
    </html>
  );
}
