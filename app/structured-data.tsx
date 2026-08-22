import { canonicalUrl, getSeoPage, SEO_LAST_MODIFIED } from "./seo";
import { faqGroups, pathways, type Pathway, SITE_URL } from "./site-data";

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

const countryCodes: Record<string, string> = {
  "United States": "US", "United Kingdom": "GB", Canada: "CA", Australia: "AU", Germany: "DE", "United Arab Emirates": "AE",
};

export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization", "@id": organizationId, name: "Migrz", url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/migrz-logo.png` },
      description: "A specialist immigration consulting technology firm focused on achievement-based and high-skill mobility pathways.",
      address: { "@type": "PostalAddress", streetAddress: "2261 Market Street", addressLocality: "San Francisco", addressRegion: "CA", postalCode: "94114", addressCountry: "US" },
      sameAs: ["https://linkedin.com/company/migrz", "https://facebook.com/themigrz/", "https://instagram.com/themigrz", "https://x.com/themigrz"],
      knowsAbout: pathways.map((pathway) => pathway.title),
    },
    {
      "@type": "WebSite", "@id": websiteId, url: `${SITE_URL}/`, name: "Migrz",
      description: "Evidence-led immigration strategy for accomplished professionals.", publisher: { "@id": organizationId }, inLanguage: "en-US",
    },
  ],
};

function breadcrumb(slug: string, name: string) {
  if (!slug) return undefined;
  return {
    "@type": "BreadcrumbList", "@id": `${canonicalUrl(slug)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: canonicalUrl(slug) },
    ],
  };
}

function pathwayService(pathway: Pathway) {
  const url = canonicalUrl(pathway.slug);
  return {
    "@type": "Service", "@id": `${url}#service`, name: `${pathway.title} immigration strategy`,
    description: pathway.summary, serviceType: "Immigration pathway assessment and evidence strategy",
    provider: { "@id": organizationId },
    areaServed: { "@type": "Country", name: pathway.country, identifier: countryCodes[pathway.country] },
    audience: { "@type": "Audience", audienceType: pathway.candidates.join(", ") },
    subjectOf: { "@type": "WebPage", name: pathway.officialLabel, url: pathway.officialUrl },
  };
}

export function pageGraph(slug: string) {
  const seo = getSeoPage(slug);
  const url = canonicalUrl(slug);
  const pathway = pathways.find((item) => item.slug === slug);
  const graph: Record<string, unknown>[] = [];
  const crumb = breadcrumb(slug, seo.title);
  if (crumb) graph.push(crumb);

  const webPage: Record<string, unknown> = {
    "@type": seo.schemaType || "WebPage", "@id": `${url}#webpage`, url, name: seo.title,
    description: seo.description, isPartOf: { "@id": websiteId }, about: seo.keywords.slice(0, 12),
    publisher: { "@id": organizationId }, inLanguage: "en-US", dateModified: SEO_LAST_MODIFIED,
  };
  if (crumb) webPage.breadcrumb = { "@id": `${url}#breadcrumb` };

  if (pathway) {
    webPage.mainEntity = { "@id": `${url}#service` };
    graph.push(webPage, pathwayService(pathway));
  } else if (slug === "faqs") {
    webPage.mainEntity = faqGroups.flatMap((group) => group.items.map(([question]) => ({ "@id": `${url}#${question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` })));
    graph.push(webPage, ...faqGroups.flatMap((group) => group.items.map(([question, answer]) => ({
      "@type": "Question", "@id": `${url}#${question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name: question, acceptedAnswer: { "@type": "Answer", text: answer },
    }))));
  } else if (slug === "process") {
    const processId = `${url}#process`;
    webPage.mainEntity = { "@id": processId };
    graph.push(webPage, {
      "@type": "ItemList", "@id": processId, name: "The Migrz immigration process",
      itemListElement: ["Assess", "Compare", "Build", "Manage"].map((name, index) => ({ "@type": "ListItem", position: index + 1, name })),
    });
  } else if (slug === "team") {
    const people = [
      { "@type": "Person", "@id": `${url}#uchechukwu-ajuzieogu`, name: "Uchechukwu Ajuzieogu", jobTitle: "CEO and Co-Founder", worksFor: { "@id": organizationId } },
      { "@type": "Person", "@id": `${url}#maryangel-nnamdi`, name: "Maryangel Nnamdi", jobTitle: "COO and Co-Founder", worksFor: { "@id": organizationId } },
    ];
    webPage.mainEntity = people.map((person) => ({ "@id": person["@id"] }));
    graph.push(webPage, ...people);
  } else if (slug === "case-studies") {
    const caseListId = `${url}#cases`;
    webPage.mainEntity = { "@id": caseListId };
    graph.push(webPage, { "@type": "ItemList", "@id": caseListId, name: "Migrz published client outcome snapshots", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Healthcare professional — EB-1A" },
      { "@type": "ListItem", position: 2, name: "Software architect — National Interest Waiver" },
      { "@type": "ListItem", position: 3, name: "Fintech founder — UAE Golden Visa" },
    ] });
  } else if (slug === "assessment") {
    const assessmentId = `${url}#service`;
    webPage.mainEntity = { "@id": assessmentId };
    graph.push(webPage, { "@type": "Service", "@id": assessmentId, name: "Migrz professional immigration assessment", description: seo.description, provider: { "@id": organizationId }, offers: { "@type": "Offer", price: "350", priceCurrency: "USD", url: "https://forms.migrzz.com/?fluent-form=6", availability: "https://schema.org/InStock" } });
  } else if (!slug) {
    const servicesId = `${url}#pathways`;
    webPage.mainEntity = { "@id": servicesId };
    graph.push(webPage, {
      "@type": "ItemList", "@id": servicesId, name: "Immigration pathways compared by Migrz",
      itemListElement: pathways.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: canonicalUrl(item.slug) })),
    });
  } else {
    if (slug === "about") webPage.mainEntity = { "@id": organizationId };
    graph.push(webPage);
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
