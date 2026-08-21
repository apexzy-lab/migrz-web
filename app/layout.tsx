import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-serif", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const image = host ? `${protocol}://${host}/og.png` : undefined;
  return {
    title: "Migrz — Six UI Directions",
    description: "A research-led interactive UI design lab for Migrz.",
    openGraph: image ? { title: "Migrz — Six UI Directions", description: "Six research-led directions for achievement-based immigration.", images: [image] } : undefined,
    twitter: image ? { card: "summary_large_image", title: "Migrz — Six UI Directions", description: "Six research-led directions for achievement-based immigration.", images: [image] } : undefined,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${mono.variable} ${serif.variable}`}>{children}</body></html>;
}
