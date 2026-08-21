import type { MetadataRoute } from "next";
import { routeSlugs, SITE_URL } from "./site-data";
export const dynamic="force-static";
export default function sitemap():MetadataRoute.Sitemap{return[{url:`${SITE_URL}/`,lastModified:new Date(),changeFrequency:"weekly",priority:1},...routeSlugs.map(slug=>({url:`${SITE_URL}/${slug}/`,lastModified:new Date(),changeFrequency:"monthly" as const,priority:slug.includes("/")?.8:.7}))];}
