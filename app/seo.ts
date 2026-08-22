import type { Metadata } from "next";
import { pathways, type Pathway, SITE_URL } from "./site-data";

export const SEO_LAST_MODIFIED = "2026-08-22";

const sharedKeywords = [
  "achievement based immigration",
  "immigration strategy",
  "skilled professional immigration",
  "permanent residency pathways",
  "immigration evidence assessment",
  "global talent immigration",
  "immigration pathway comparison",
  "expert immigration assessment",
];

type SeoPage = {
  title: string;
  description: string;
  keywords: string[];
  schemaType?: "AboutPage" | "CollectionPage" | "FAQPage" | "WebPage";
};

const pageSpecific: Record<string, Omit<SeoPage, "keywords"> & { keywords: string[] }> = {
  "": {
    title: "Achievement-Based Immigration Strategy",
    description: "Compare evidence-led immigration pathways for accomplished professionals across the US, UK, Canada, Australia, Germany, and the UAE with Migrz.",
    keywords: ["immigration for accomplished professionals", "international career mobility", "high skill immigration pathways", "immigration profile review", "global permanent residence options", "merit based immigration advice", "professional immigration consultation", "talent visa comparison", "immigration route eligibility", "cross border career strategy", "immigration case strategy", "Migrz immigration"],
  },
  "what-makes-us-different": {
    title: "What Makes Migrz Different",
    description: "See how Migrz combines cross-border pathway comparison, evidence strategy, candid case selection, and human specialist review for accomplished professionals.",
    keywords: ["evidence led immigration consulting", "human immigration assessment", "immigration strategy difference", "specialist immigration support", "cross border pathway comparison", "honest immigration assessment", "immigration evidence architecture", "founder led immigration service", "immigration case selection", "career achievement analysis", "professional immigration strategy firm", "Migrz difference"],
    schemaType: "WebPage",
  },
  process: {
    title: "The Migrz Immigration Process",
    description: "Understand the Migrz process from paid professional assessment and pathway comparison through evidence strategy, case preparation, filing, and follow-through.",
    keywords: ["immigration assessment process", "immigration case preparation steps", "immigration evidence review process", "professional pathway assessment", "visa strategy consultation process", "immigration application preparation", "immigration document strategy", "immigration case management", "immigration filing support", "immigration assessment report", "immigration consultation timeline", "Migrz process"],
    schemaType: "WebPage",
  },
  "98-success-rate": {
    title: "Reported Immigration Case Outcomes",
    description: "Understand Migrz's reported 98% approval outcome, the screened-case methodology behind it, its limitations, and how careful case selection protects clients.",
    keywords: ["immigration approval outcomes", "98 percent immigration success rate", "screened immigration cases", "immigration case outcome methodology", "immigration approval rate explained", "immigration case selection standards", "immigration results transparency", "visa approval outcome analysis", "immigration success rate limitations", "evidence based case preparation", "immigration client outcomes", "Migrz success rate"],
    schemaType: "WebPage",
  },
  customers: {
    title: "Who Migrz Helps",
    description: "Explore immigration strategy for technology leaders, researchers, healthcare innovators, founders, executives, engineers, creatives, and other specialists.",
    keywords: ["immigration for technology leaders", "immigration for researchers", "immigration for healthcare professionals", "immigration for founders", "immigration for executives", "immigration for engineers", "immigration for academics", "immigration for creative professionals", "immigration for scientists", "immigration for product leaders", "immigration for specialists", "professional immigration customers"],
    schemaType: "CollectionPage",
  },
  faqs: {
    title: "Immigration Strategy FAQs",
    description: "Get clear answers about Migrz assessments, eligibility, evidence, pathway choice, costs, timing, legal scope, case preparation, and approval limitations.",
    keywords: ["immigration assessment questions", "immigration eligibility FAQ", "visa evidence questions", "immigration consultation cost", "immigration case timing", "immigration approval guarantee", "immigration pathway questions", "recommendation letter evidence", "confidential immigration evidence", "choosing an immigration country", "professional assessment FAQ", "Migrz FAQ"],
    schemaType: "FAQPage",
  },
  about: {
    title: "About Migrz",
    description: "Learn about Migrz, a specialist immigration consulting technology firm helping accomplished professionals turn career evidence into credible mobility strategies.",
    keywords: ["about Migrz", "Migrz immigration company", "specialist immigration technology firm", "achievement immigration specialists", "immigration consulting company", "career mobility advisors", "global immigration strategy firm", "immigration evidence specialists", "professional migration consulting", "human led immigration technology", "San Francisco immigration technology", "international mobility firm"],
    schemaType: "AboutPage",
  },
};

function pathwayKeywords(pathway: Pathway) {
  return [
    `${pathway.title} eligibility`, `${pathway.title} requirements`, `${pathway.title} evidence`,
    `${pathway.title} application strategy`, `${pathway.title} assessment`, `${pathway.title} guidance`,
    `${pathway.country} immigration for professionals`, `${pathway.country} permanent residency`,
    `${pathway.country} skilled immigration`, `${pathway.country} talent visa`,
    `${pathway.code} immigration pathway`, `${pathway.country} immigration consultation`,
    ...sharedKeywords,
  ];
}

export function getSeoPage(slug: string): SeoPage {
  const pathway = pathways.find((item) => item.slug === slug);
  if (pathway) {
    return {
      title: pathway.title,
      description: `${pathway.summary} Compare eligibility, evidence, benefits, limitations, and official guidance with Migrz.`,
      keywords: pathwayKeywords(pathway),
      schemaType: "WebPage",
    };
  }
  const page = pageSpecific[slug];
  if (!page) throw new Error(`Missing SEO configuration for ${slug || "home"}`);
  return { ...page, keywords: [...page.keywords, ...sharedKeywords] };
}

export function canonicalUrl(slug = "") {
  return slug ? `${SITE_URL}/${slug}` : `${SITE_URL}/`;
}

export function pageMetadata(slug: string, absoluteTitle = false): Metadata {
  const page = getSeoPage(slug);
  const canonical = canonicalUrl(slug);
  const socialTitle = slug ? `${page.title} | Migrz` : `Migrz | ${page.title}`;
  return {
    title: absoluteTitle ? { absolute: socialTitle } : page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    authors: [{ name: "Migrz", url: SITE_URL }],
    creator: "Migrz",
    publisher: "Migrz",
    category: "Immigration strategy",
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: "website", url: canonical, siteName: "Migrz", title: socialTitle,
      description: page.description,
      images: [{ url: `${SITE_URL}/og.png`, width: 1732, height: 909, alt: "Migrz — achievement-based immigration strategy" }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description: page.description, images: [`${SITE_URL}/og.png`] },
  };
}

export const allSeoSlugs = ["", ...Object.keys(pageSpecific).filter(Boolean), ...pathways.map((pathway) => pathway.slug)];
