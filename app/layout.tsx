import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./mobile.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = host ? `${protocol}://${host}` : "https://wardrobe.local";
  const title = "衣橱档案｜拆开、重组、再穿一次";
  const description = "记录衣物，重组造型，保存 OOTD，审查每一次购买欲望。";

  return {
    title,
    description,
    applicationName: "衣橱档案",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "衣橱档案",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1680, height: 941, alt: "衣橱档案" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
