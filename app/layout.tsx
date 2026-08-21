import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { SiteFooter, SiteHeader } from "./site-components";
import { SITE_URL } from "./site-data";
import "./globals.css";

const sans=Geist({variable:"--font-sans",subsets:["latin"]});
const mono=Geist_Mono({variable:"--font-mono",subsets:["latin"]});
const serif=Newsreader({variable:"--font-serif",subsets:["latin"]});

export const metadata:Metadata={
  metadataBase:new URL(SITE_URL), title:{default:"Migrz | Achievement-Based Immigration Strategy",template:"%s | Migrz"},
  description:"Evidence-led immigration strategy for exceptional professionals.",
  icons:{icon:"/favicon.png",apple:"/apple-touch-icon.png"},
  openGraph:{type:"website",siteName:"Migrz",images:[{url:"/og.png",width:1732,height:909,alt:"Migrz — Your achievements are a passport"}]},
  twitter:{card:"summary_large_image",images:["/og.png"]},
};

const organization={"@context":"https://schema.org","@type":"Organization","@id":`${SITE_URL}/#organization`,name:"Migrz",url:SITE_URL,logo:`${SITE_URL}/migrz-logo.png`,description:"Specialized immigration consulting technology firm focused on achievement-based and high-skill permanent-residency pathways.",address:{"@type":"PostalAddress",streetAddress:"2261 Market Street",addressLocality:"San Francisco",addressRegion:"CA",postalCode:"94114",addressCountry:"US"},sameAs:["https://linkedin.com/company/migrz","https://facebook.com/themigrz/","https://instagram.com/themigrz","https://x.com/themigrz"]};

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${sans.variable} ${mono.variable} ${serif.variable}`}><a className="skip-link" href="#main">Skip to content</a><SiteHeader/><main id="main">{children}</main><SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization)}}/></body></html>}
