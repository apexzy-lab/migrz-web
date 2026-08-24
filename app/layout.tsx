/* Vendor tracking snippets intentionally use inline scripts. */
/* eslint-disable @next/next/next-script-for-ga */
import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { SiteFooter, SiteHeader } from "./site-components";
import { SITE_URL } from "./site-data";
import { JsonLd, siteGraph } from "./structured-data";
import { AnalyticsConsent } from "./analytics-consent";
import "./globals.css";
import "./portal-enhancements.css";
import "flag-icons/css/flag-icons.min.css";

const sans=Geist({variable:"--font-sans",subsets:["latin"]});
const mono=Geist_Mono({variable:"--font-mono",subsets:["latin"]});
const serif=Newsreader({variable:"--font-serif",subsets:["latin"]});

export const metadata:Metadata={
  metadataBase:new URL(SITE_URL), title:{default:"Migrz | Achievement-Based Immigration Strategy",template:"%s | Migrz"},
  description:"Evidence-led immigration strategy for exceptional professionals.",
  icons:{icon:"/favicon.png",apple:"/apple-touch-icon.png"},
  applicationName:"Migrz", creator:"Migrz", publisher:"Migrz", category:"Immigration strategy",
  formatDetection:{email:false,address:false,telephone:false},
  openGraph:{type:"website",siteName:"Migrz",images:[{url:"/og.png",width:1732,height:909,alt:"Migrz, Your work has crossed borders. Your life should too."}]},
  twitter:{card:"summary_large_image",images:["/og.png"]},
};

const googleAnalytics=`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var migrzConsent = localStorage.getItem('migrz_analytics_consent') === 'accepted' ? 'granted' : 'denied';
gtag('consent', 'default', {
  analytics_storage: migrzConsent,
  ad_storage: migrzConsent,
  ad_user_data: migrzConsent,
  ad_personalization: migrzConsent,
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', 'G-8X3PLHV88L', {
  linker: { domains: ['migrzz.com', 'apply.migrzz.com'] },
  allow_google_signals: migrzConsent === 'granted'
});`;

const microsoftClarity=`if(localStorage.getItem('migrz_analytics_consent') === 'accepted'){(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "uw607xjcnq");}`;

const metaPixel=`if(localStorage.getItem('migrz_analytics_consent') === 'accepted'){!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1977570466130181');
fbq('track', 'PageView');}`;

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8X3PLHV88L"/>
  <script dangerouslySetInnerHTML={{__html:googleAnalytics}}/>
  <script dangerouslySetInnerHTML={{__html:microsoftClarity}}/>
  <script dangerouslySetInnerHTML={{__html:metaPixel}}/>
</head><body className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
  <a className="skip-link" href="#main">Skip to content</a><SiteHeader/><main id="main">{children}</main><SiteFooter/><AnalyticsConsent/><JsonLd data={siteGraph}/>
</body></html>}
