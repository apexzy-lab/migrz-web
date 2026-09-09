"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "migrz_analytics_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
const TRACKED_PARAMETERS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

function recordAssessmentClick(anchor: HTMLAnchorElement) {
  const target = new URL(anchor.href);
  const current = new URL(window.location.href);
  for (const parameter of TRACKED_PARAMETERS) {
    const value = current.searchParams.get(parameter);
    if (value && !target.searchParams.has(parameter)) target.searchParams.set(parameter, value);
  }
  target.searchParams.set("migrz_source_page", current.pathname);
  target.searchParams.set("migrz_source_cta", anchor.textContent?.trim().slice(0, 80) || "assessment link");
  anchor.href = target.toString();
  const event = { page_path: current.pathname, link_url: target.toString(), link_text: anchor.textContent?.trim() || "assessment link" };
  window.gtag?.("event", "assessment_click", event);
  window.fbq?.("trackCustom", "AssessmentClick", event);
  window.clarity?.("event", "assessment_click");
}

function storedConsent(): "accepted" | "declined" | null {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(CONSENT_KEY);
  } catch {
    // Some privacy modes block localStorage. The first-party cookie below is
    // the durable fallback, so a saved choice does not become a recurring UI.
  }
  if (stored !== "accepted" && stored !== "declined") {
    stored = document.cookie.split("; ").find((item) => item.startsWith(`${CONSENT_KEY}=`))?.split("=")[1] || null;
  }
  return stored === "accepted" || stored === "declined" ? stored : null;
}

function persistConsent(value: "accepted" | "declined") {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // The cookie remains available when localStorage is restricted.
  }
  document.cookie = `${CONSENT_KEY}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
}

export function AnalyticsConsent() {
  const [choice, setChoice] = useState<"accepted" | "declined" | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = storedConsent();
    const initialize = window.setTimeout(() => {
      setChoice(stored);
      setOpen(stored === null);
    }, 0);

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const settings = target?.closest<HTMLElement>("[data-cookie-settings]");
      if (settings) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (anchor && new URL(anchor.href, window.location.href).hostname === "apply.migrzz.com") recordAssessmentClick(anchor);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(initialize);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const save = (value: "accepted" | "declined") => {
    persistConsent(value);
    setChoice(value);
    setOpen(false);
    window.gtag?.("consent", "update", {
      analytics_storage: value === "accepted" ? "granted" : "denied",
      ad_storage: value === "accepted" ? "granted" : "denied",
      ad_user_data: value === "accepted" ? "granted" : "denied",
      ad_personalization: value === "accepted" ? "granted" : "denied",
    });
    if (value === "accepted") window.location.reload();
  };

  if (!open) return null;
  return <aside className="consent-panel" aria-label="Cookie preferences" aria-live="polite">
    <div><span>Privacy choices</span><h2>Use analytics to improve Migrz?</h2><p>Necessary site functions always work. With your permission, Migrz also uses Google Analytics, Microsoft Clarity, and Meta Pixel to understand visits and assessment interest.</p><Link href="/cookie-policy">Read the cookie policy</Link></div>
    <div className="consent-actions"><button type="button" onClick={() => save("declined")}>Necessary only</button><button type="button" onClick={() => save("accepted")}>Allow analytics</button>{choice && <button type="button" className="consent-close" onClick={() => setOpen(false)}>Close</button>}</div>
  </aside>;
}
