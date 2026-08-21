"use client";

import { useEffect, useState } from "react";

const designs = [
  ["merit", "01", "The Merit Index", "Recommended", "Evidence intelligence meets premium advisory"],
  ["atlas", "02", "Atlas Atelier", "Editorial", "A worldly private-client experience"],
  ["signal", "03", "Global Signal", "Bold", "High energy for ambitious operators"],
  ["dossier", "04", "Dossier OS", "Product-led", "Turn expertise into a visible system"],
  ["northstar", "05", "Northstar", "Optimistic", "A clear route to the next chapter"],
  ["quiet", "06", "Quiet Authority", "Institutional", "Calm confidence for consequential decisions"],
] as const;
type DesignId = (typeof designs)[number][0];

const pathways = [
  ["EB-1A", "United States · Extraordinary ability", "92"],
  ["NIW", "United States · National interest", "87"],
  ["GTV", "United Kingdom · Global talent", "81"],
];
const proof = [["3,738+", "professionals supported"], ["6", "destination countries"], ["14", "specialist pathways"], ["48 hrs", "assessment delivery"]];
const services = [
  ["01", "Profile assessment", "Map your work, recognition, impact, and evidence against relevant pathways."],
  ["02", "Pathway strategy", "Compare routes across countries, trade-offs, timelines, and evidence burden."],
  ["03", "Petition building", "Shape a coherent case, coordinate documentation, and prepare for submission."],
];

function Mark() { return <a className="mark" href="#top" aria-label="Migrz home">MIGRZ<span>•</span></a>; }
function Arrow() { return <span aria-hidden="true">↗</span>; }

function Nav({ active }: { active: DesignId }) {
  return <header className="site-nav"><Mark/><nav aria-label="Main navigation"><a href="#pathways">Pathways</a><a href="#method">Method</a><a href="#proof">Results</a></nav><a className="nav-cta" href="#assessment">Start assessment <Arrow/></a><span className="concept-stamp">Concept {designs.findIndex(d => d[0] === active) + 1}/6</span></header>;
}

function RouteCard() {
  return <div className="route-card" id="pathways">
    <div className="route-head"><div><span className="eyebrow">Illustrative profile match</span><h3>Your strongest pathways</h3></div><span className="live-dot">Assessment preview</span></div>
    <div className="profile-strip"><span className="avatar">UA</span><div><strong>Product & AI leader</strong><small>8 years · 3 markets · 12 evidence signals</small></div></div>
    <div className="route-list">{pathways.map((p,i)=><div className="route-row" key={p[0]}><span className="route-rank">0{i+1}</span><span><strong>{p[0]}</strong><small>{p[1]}</small></span><span className="score"><b>{p[2]}</b>/100</span></div>)}</div>
    <div className="route-foot"><span>Next: evidence review</span><span>Report in 48 hours →</span></div>
  </div>;
}

function Orbit() {
  return <div className="evidence-orbit" aria-label="Evidence profile visualization"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><span className="orbit-tag tag-one">Leadership</span><span className="orbit-tag tag-two">Original work</span><span className="orbit-tag tag-three">Recognition</span><span className="orbit-tag tag-four">Impact</span><div className="orbit-core"><span>YOUR</span><strong>MERIT</strong><small>made legible</small></div></div>;
}

function EditorialHero({ quiet=false }: { quiet?: boolean }) {
  return <section className="hero hero-editorial" id="top"><div className="hero-kicker"><span>Global mobility, precisely considered</span><span>Est. 2019 · Six destinations</span></div><div className="editorial-grid"><div className="editorial-copy"><span className="eyebrow">For exceptional professionals</span><h1>Your work has<br/>crossed borders.<br/><em>You should too.</em></h1><p>Migrz turns an accomplished career into a clear, evidence-led strategy for permanent residency.</p><div className="hero-actions"><a className="primary" href="#assessment">Discover your pathways <Arrow/></a><a className="text-link" href="#method">Explore the method →</a></div></div><div className="editorial-art"><div className="passport-frame"><span>{quiet ? <>MERIT<br/>DESERVES<br/>MOBILITY</> : <>THE WORLD<br/>IS NOT<br/>ONE SIZE</>}</span><small>US · UK · CA · AU · DE · UAE</small><div className="passport-stamp">M<b>19—∞</b></div></div><p>One profile. Several possible futures. We identify the route that makes the strongest case for yours.</p></div></div></section>;
}

function Hero({ active }: { active: DesignId }) {
  if (active === "atlas" || active === "quiet") return <EditorialHero quiet={active === "quiet"}/>;
  if (active === "signal") return <section className="hero hero-signal" id="top"><span className="signal-ticker">EB-1A · NIW · GLOBAL TALENT · GOLDEN VISA · PNP · <b>YOUR NEXT MOVE</b></span><div className="signal-grid"><div><span className="eyebrow">Immigration strategy for people going places</span><h1>YOU DID<br/>THE WORK.<br/><span>NOW MOVE.</span></h1><p>Your achievements can unlock more than a promotion. Migrz maps your evidence to high-skill residency pathways across six countries.</p><a className="primary" href="#assessment">Find my route <Arrow/></a></div><Orbit/></div></section>;
  if (active === "dossier") return <section className="hero hero-dossier" id="top"><div className="dossier-copy"><span className="eyebrow">Migrz intelligence platform + expert team</span><h1>Your career is already a case.<br/><span>We make it decision-ready.</span></h1><p>A rigorous immigration assessment that finds the strongest route, exposes evidence gaps, and gives you a clear plan to permanent residency.</p><div className="hero-actions"><a className="primary" href="#assessment">Run my assessment <Arrow/></a><span className="micro-proof">7+ routes reviewed · Report in 48 hours</span></div></div><RouteCard/></section>;
  if (active === "northstar") return <section className="hero hero-northstar" id="top"><div className="north-copy"><span className="eyebrow">Permanent residency, built around your potential</span><h1>There is more than<br/>one way <em>forward.</em></h1><p>We compare achievement-based pathways across the US, UK, Canada, Australia, Germany, and Dubai—then build the strategy that fits your life.</p><div className="hero-actions"><a className="primary" href="#assessment">See where you fit <Arrow/></a><a className="text-link" href="#proof">View client outcomes</a></div></div><div className="route-map" aria-label="Destination pathway map"><span className="map-origin">YOU</span><span className="map-line line-a"/><span className="map-line line-b"/><span className="map-line line-c"/><span className="map-point point-a"><b>US</b><small>EB-1A · NIW</small></span><span className="map-point point-b"><b>UK</b><small>Global Talent</small></span><span className="map-point point-c"><b>UAE</b><small>Golden Visa</small></span><div className="map-note">One assessment.<br/><strong>Six countries.</strong></div></div></section>;
  return <section className="hero hero-merit" id="top"><div className="merit-copy"><div className="recommended-pill">Our recommended direction</div><span className="eyebrow">Achievement-based immigration, engineered around you</span><h1>Your achievements<br/>are a <em>passport.</em></h1><p>Migrz identifies the permanent-residency pathways your career has already earned—then builds the evidence strategy to move you forward.</p><div className="hero-actions"><a className="primary" href="#assessment">Map my pathways <Arrow/></a><a className="text-link" href="#method">How Migrz works →</a></div><div className="merit-mini"><span>Paid professional assessment</span><span>48-hour report</span><span>6 countries</span></div></div><RouteCard/></section>;
}

function Proof() { return <section className="proof-band" id="proof"><span className="proof-label">Migrz in numbers</span>{proof.map(p=><div key={p[1]}><strong>{p[0]}</strong><span>{p[1]}</span></div>)}</section>; }
function Method() { return <section className="method" id="method"><div className="section-intro"><span className="eyebrow">The Migrz method</span><h2>Strategy before paperwork.</h2><p>The right route is not always the most obvious one. We begin with your complete professional record and compare the paths before committing to a country or petition.</p></div><div className="service-grid">{services.map(s=><article key={s[0]}><span>{s[0]}</span><h3>{s[1]}</h3><p>{s[2]}</p><a href="#assessment">Explore <Arrow/></a></article>)}</div></section>; }
function Assessment() { return <section className="assessment" id="assessment"><div><span className="eyebrow">Professional assessment</span><h2>Find the route your résumé cannot show you.</h2></div><div className="assessment-card"><div><strong>7+ pathways reviewed</strong><span>against your evidence</span></div><div><strong>Detailed report</strong><span>delivered in 48 hours</span></div><div><strong>Expert session</strong><span>to explain the strategy</span></div><a href="https://forms.migrzz.com/?fluent-form=6">Start the paid assessment <Arrow/></a></div></section>; }

export function DesignLab() {
  const [active,setActive] = useState<DesignId>("merit");
  const current = designs.find(d=>d[0]===active) ?? designs[0];
  function choose(id:DesignId){ setActive(id); window.history.replaceState({},"",`${window.location.pathname}?design=${id}`); window.scrollTo({top:0,behavior:"smooth"}); }
  function move(n:number){ const i=designs.findIndex(d=>d[0]===active); choose(designs[(i+n+designs.length)%designs.length][0]); }
  useEffect(()=>{ const p=new URLSearchParams(window.location.search).get("design") as DesignId|null; if(p&&designs.some(d=>d[0]===p)) setActive(p); },[]);
  useEffect(()=>{ const key=(e:KeyboardEvent)=>{const i=Number(e.key)-1;if(i>=0&&i<6)choose(designs[i][0]);else if(e.key==="ArrowRight")move(1);else if(e.key==="ArrowLeft")move(-1)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);});
  return <main className={`site concept-${active}`}><aside className="lab-bar" aria-label="Design selector"><div className="lab-title"><span>UI DESIGN LAB</span><b>Six directions for Migrz</b></div><div className="lab-options">{designs.map(d=><button key={d[0]} onClick={()=>choose(d[0])} className={active===d[0]?"active":""} aria-pressed={active===d[0]}><span>{d[1]}</span><b>{d[2]}</b><small>{d[3]}</small></button>)}</div><div className="lab-controls"><button onClick={()=>move(-1)} aria-label="Previous design">←</button><span>{current[4]}</span><button onClick={()=>move(1)} aria-label="Next design">→</button></div></aside><div className="demo-shell"><Nav active={active}/><Hero active={active}/><Proof/><Method/><Assessment/><footer><Mark/><p>Exceptional careers deserve more borders—not fewer.</p><span>Concept demo · Migrz 2026</span></footer></div></main>;
}
