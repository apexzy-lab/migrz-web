import type { Metadata } from "next";
import { HomePage } from "./site-components";
import { pageMetadata } from "./seo";
import { JsonLd, pageGraph } from "./structured-data";

export const metadata: Metadata = pageMetadata("", true);

export default function Page(){ return <><HomePage/><JsonLd data={pageGraph("")}/></>; }
