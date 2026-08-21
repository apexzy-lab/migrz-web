import type { MetadataRoute } from "next";
export const dynamic="force-static";
export default function manifest():MetadataRoute.Manifest{return{name:"Migrz",short_name:"Migrz",description:"Achievement-based immigration strategy for exceptional professionals.",start_url:"/",display:"standalone",background_color:"#f3f0e7",theme_color:"#102321"};}
