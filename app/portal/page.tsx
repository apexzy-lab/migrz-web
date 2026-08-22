import type { Metadata } from "next";
import { PortalClient } from "./portal-client";

export const metadata: Metadata = {
  title: "Applicant Portal",
  description: "A private Migrz workspace for assessment, evidence and onboarding.",
  robots: { index: false, follow: false },
};

export default function PortalPage() {
  return <PortalClient />;
}
