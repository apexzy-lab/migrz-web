"use client";

import { useMemo, useRef, useState } from "react";
import { countries, countryByCode, flagClass } from "@/app/portal/countries";

export function CountryPicker({ value, onChange, label = "Country of residence" }: { value: string; onChange: (code: string) => void; label?: string }) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const searchRef = useRef<HTMLInputElement>(null); const selected = countryByCode(value);
  const results = useMemo(() => { const term = query.trim().toLowerCase(); return countries.filter((country) => !term || country.name.toLowerCase().includes(term) || country.code.toLowerCase().includes(term)).slice(0, 250); }, [query]);
  const choose = (code: string) => { onChange(code); setOpen(false); setQuery(""); };
  return <div className="country-picker"><span className="country-picker-label">{label}</span><button type="button" className="country-picker-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen((current) => !current); setTimeout(() => searchRef.current?.focus(), 0); }}><span className={flagClass(selected?.code || "un")} aria-hidden="true" /><strong>{selected?.name || "Choose a country"}</strong><small>{selected?.code || ""}</small><i aria-hidden="true">⌄</i></button>{open && <div className="country-picker-popover"><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search countries" aria-label="Search countries" /><div role="listbox" aria-label={label}>{results.map((country) => <button type="button" role="option" aria-selected={country.code === value} key={country.code} onClick={() => choose(country.code)}><span className={flagClass(country.code)} aria-hidden="true" /><span>{country.name}</span><small>{country.code}</small></button>)}</div></div>}</div>;
}
