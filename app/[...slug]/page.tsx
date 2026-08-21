import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage, PathwayPage } from "../site-components";
import { pathways, routeSlugs, SITE_URL } from "../site-data";

export const dynamicParams = false;
export function generateStaticParams(){ return routeSlugs.map(slug=>({slug:slug.split("/")})); }

type Props={params:Promise<{slug:string[]}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params; const key=slug.join("/"); const pathway=pathways.find(p=>p.slug===key);
  const titles:Record<string,string>={about:"About Migrz","what-makes-us-different":"What Makes Migrz Different",process:"Our Process","98-success-rate":"Reported Outcomes",customers:"Who Migrz Helps",faqs:"Frequently Asked Questions"};
  const title=pathway?.title??titles[key]; if(!title)return{}; const description=pathway?.summary??`Learn about ${title} and the Migrz evidence-led immigration strategy.`;
  return{title,description,alternates:{canonical:`/${key}/`},openGraph:{title:`${title} | Migrz`,description,url:`${SITE_URL}/${key}/`}};
}

export default async function Page({params}:Props){
  const {slug}=await params; const key=slug.join("/"); const pathway=pathways.find(p=>p.slug===key);
  if(pathway)return <PathwayPage pathway={pathway}/>; const page=<ContentPage slug={key}/>; if(!page)notFound(); return page;
}
