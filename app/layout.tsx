import type { Metadata, Viewport } from "next";
import { Provider } from "@/components/provider";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "FIXIHUB — Stories, without limits.",
    template: "%s · FIXIHUB",
  },
  description:
    "An independent academic publisher order and preorder management prototype.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FIXIHUB" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <Shell>{children}</Shell>
        </Provider>
      </body>
    </html>
  );
}
