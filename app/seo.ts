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
    title: "Immigration Results and Evidence Method",
    description: "See how Migrz improves route selection, evidence discovery, case preparation, and decision quality before an immigration application is filed.",
    keywords: ["immigration case preparation results", "evidence based immigration strategy", "immigration route assessment", "immigration evidence discovery", "professional immigration assessment", "immigration case selection standards", "immigration written pathway report", "immigration evidence map", "achievement based immigration strategy", "immigration case preparation method", "immigration client case studies", "Migrz results"],
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
  team: {
    title: "Migrz Leadership and Responsibilities",
    description: "Meet Migrz co-founders Uchechukwu Ajuzieogu and Maryangel Nnamdi, and understand the boundaries between strategy, operations, legal work, and government decisions.",
    keywords: ["Migrz founders", "Uchechukwu Ajuzieogu", "Maryangel Nnamdi", "Migrz leadership team", "immigration strategy leadership", "founder led immigration service", "immigration operations team", "immigration evidence specialists", "immigration service accountability", "independent immigration attorneys", "Migrz CEO", "Migrz COO"],
    schemaType: "AboutPage",
  },
  "case-studies": {
    title: "Migrz Immigration Case Studies",
    description: "Read privacy-protected Migrz client outcome snapshots covering EB-1A, National Interest Waiver, and UAE Golden Visa strategy, with limitations explained clearly.",
    keywords: ["immigration case studies", "EB-1A client story", "NIW client outcome", "UAE Golden Visa case study", "immigration approval story", "immigration pathway case example", "healthcare EB-1A case", "software architect NIW case", "fintech founder Golden Visa", "immigration route change story", "Migrz client outcomes", "achievement immigration results"],
    schemaType: "CollectionPage",
  },
  assessment: {
    title: "$350 Professional Immigration Assessment",
    description: "See what the $350 Migrz professional assessment includes: cross-route evidence review, a written eligibility report, an expert consultation, and a practical next-step plan.",
    keywords: ["paid immigration assessment", "$350 immigration assessment", "immigration eligibility report", "professional immigration evaluation", "visa pathway assessment", "immigration evidence review", "immigration strategy consultation", "immigration assessment deliverables", "immigration route recommendation", "48 hour immigration report", "Migrz assessment price", "start Migrz assessment"],
    schemaType: "WebPage",
  },
  privacy: {
    title: "Migrz Privacy Notice",
    description: "Understand how Migrz handles website, assessment, professional, analytics, and communication information, together with available privacy choices.",
    keywords: ["Migrz privacy policy", "immigration data privacy", "assessment information privacy", "immigration document security", "website analytics privacy", "professional information handling", "immigration consultation privacy", "client data retention", "privacy rights immigration service", "Migrz data protection", "assessment form privacy", "immigration records privacy"],
    schemaType: "WebPage",
  },
  terms: {
    title: "Migrz Website Terms",
    description: "Review the terms governing Migrz website information, paid service boundaries, responsible use, intellectual property, accuracy, and outcome limitations.",
    keywords: ["Migrz terms of service", "immigration website terms", "immigration assessment terms", "paid assessment conditions", "immigration service agreement", "immigration information disclaimer", "Migrz service terms", "immigration consulting conditions", "assessment payment terms", "immigration website responsible use", "Migrz intellectual property", "immigration service limitations"],
    schemaType: "WebPage",
  },
  "cookie-policy": {
    title: "Migrz Cookie Policy",
    description: "Learn how Migrz uses a necessary preference record and optional Google Analytics, Microsoft Clarity, and Meta Pixel measurement technologies.",
    keywords: ["Migrz cookie policy", "Google Analytics consent", "Microsoft Clarity consent", "Meta Pixel consent", "immigration website cookies", "analytics privacy choices", "cookie settings Migrz", "website measurement consent", "assessment tracking privacy", "optional analytics cookies", "cross domain analytics consent", "necessary cookie preference"],
    schemaType: "WebPage",
  },
  accessibility: {
    title: "Migrz Accessibility Statement",
    description: "Read the Migrz commitment to keyboard, mobile, zoom, reduced-motion, assistive-technology, form, and public-content accessibility.",
    keywords: ["Migrz accessibility", "immigration website accessibility", "accessible immigration guidance", "keyboard accessible immigration site", "mobile immigration accessibility", "screen reader immigration website", "WCAG immigration site", "accessible assessment form", "reduced motion website", "accessible professional services", "report accessibility barrier", "inclusive immigration technology"],
    schemaType: "WebPage",
  },
  disclaimer: {
    title: "Migrz Professional Disclaimer",
    description: "Understand the limits of Migrz website information, assessment findings, case studies, timelines, historical outcomes, and independent legal services.",
    keywords: ["Migrz disclaimer", "immigration advice disclaimer", "no immigration approval guarantee", "immigration website not legal advice", "historical immigration results", "independent immigration attorney", "immigration assessment limitation", "case study disclaimer", "visa timeline disclaimer", "government decision disclaimer", "immigration eligibility limitation", "professional service disclaimer"],
    schemaType: "WebPage",
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
      images: [{ url: `${SITE_URL}/og.png`, width: 1732, height: 909, alt: "Migrz, achievement-based immigration strategy" }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description: page.description, images: [`${SITE_URL}/og.png`] },
  };
}

export const allSeoSlugs = ["", ...Object.keys(pageSpecific).filter(Boolean), ...pathways.map((pathway) => pathway.slug)];
