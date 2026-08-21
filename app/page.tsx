import type { Metadata } from "next";
import { DesignLab } from "./design-lab";

export const metadata: Metadata = {
  title: "Migrz — Six UI Directions",
  description:
    "Six research-led website directions for Migrz, the achievement-based immigration strategy service.",
};

export default function Home() {
  return <DesignLab />;
}
