import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage, PathwayPage } from "../site-components";
import { pathways, routeSlugs } from "../site-data";
import { pageMetadata } from "../seo";
import { JsonLd, pageGraph } from "../structured-data";

export const dynamicParams = false;
export function generateStaticParams(){ return routeSlugs.map(slug=>({slug:slug.split("/")})); }

type Props={params:Promise<{slug:string[]}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params; const key=slug.join("/"); const pathway=pathways.find(p=>p.slug===key);
  if(!pathway&&!routeSlugs.includes(key))return{};
  return pageMetadata(key);
}

export default async function Page({params}:Props){
  const {slug}=await params; const key=slug.join("/"); const pathway=pathways.find(p=>p.slug===key);
  if(pathway)return <><PathwayPage pathway={pathway}/><JsonLd data={pageGraph(key)}/></>;
  const page=<ContentPage slug={key}/>; if(!page)notFound(); return <>{page}<JsonLd data={pageGraph(key)}/></>;
}
