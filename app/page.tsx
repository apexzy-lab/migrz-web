import type { Metadata } from "next";
import { HomePage } from "./site-components";

export const metadata: Metadata = {
  title: "Migrz | Achievement-Based Immigration Strategy",
  description: "Compare achievement-based permanent-residency pathways across the US, UK, Canada, Australia, Germany, and the UAE.",
  alternates: { canonical: "/" },
};

export default function Page(){ return <HomePage/>; }
