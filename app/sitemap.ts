import type { MetadataRoute } from "next";
import { routeSlugs, SITE_URL } from "./site-data";
import { SEO_LAST_MODIFIED } from "./seo";
export const dynamic="force-static";
export default function sitemap():MetadataRoute.Sitemap{return[{url:`${SITE_URL}/`,lastModified:new Date(SEO_LAST_MODIFIED),changeFrequency:"weekly",priority:1},...routeSlugs.map(slug=>({url:`${SITE_URL}/${slug}`,lastModified:new Date(SEO_LAST_MODIFIED),changeFrequency:slug==="98-success-rate"?"weekly" as const:"monthly" as const,priority:slug.includes("/")?.9:.8}))];}
