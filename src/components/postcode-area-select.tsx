"use client";

import { useState, useRef, useEffect } from "react";

const UK_POSTCODE_AREAS: Record<string, string> = {
  AB: "Aberdeen", AL: "St Albans", B: "Birmingham", BA: "Bath", BB: "Blackburn",
  BD: "Bradford", BH: "Bournemouth", BL: "Bolton", BN: "Brighton", BR: "Bromley",
  BS: "Bristol", CA: "Carlisle", CB: "Cambridge", CF: "Cardiff", CH: "Chester",
  CM: "Chelmsford", CO: "Colchester", CR: "Croydon", CT: "Canterbury", CV: "Coventry",
  CW: "Crewe", DA: "Dartford", DD: "Dundee", DE: "Derby", DG: "Dumfries",
  DH: "Durham", DL: "Darlington", DN: "Doncaster", DT: "Dorchester", DY: "Dudley",
  E: "East London", EC: "East Central London", EH: "Edinburgh", EN: "Enfield",
  EX: "Exeter", FK: "Falkirk", FY: "Blackpool", G: "Glasgow", GL: "Gloucester",
  GU: "Guildford", HA: "Harrow", HD: "Huddersfield", HG: "Harrogate", HP: "Hemel Hempstead",
  HR: "Hereford", HS: "Outer Hebrides", HU: "Hull", HX: "Halifax", IG: "Ilford",
  IP: "Ipswich", IV: "Inverness", KA: "Kilmarnock", KT: "Kingston upon Thames",
  KW: "Kirkwall", KY: "Kirkcaldy", L: "Liverpool", LA: "Lancaster", LD: "Llandrindod Wells",
  LE: "Leicester", LL: "Llandudno", LN: "Lincoln", LS: "Leeds", LU: "Luton",
  M: "Manchester", ME: "Medway", MK: "Milton Keynes", ML: "Motherwell",
  N: "North London", NE: "Newcastle", NG: "Nottingham", NN: "Northampton",
  NP: "Newport", NR: "Norwich", NW: "North West London", OL: "Oldham",
  OX: "Oxford", PA: "Paisley", PE: "Peterborough", PH: "Perth", PL: "Plymouth",
  PO: "Portsmouth", PR: "Preston", RG: "Reading", RH: "Redhill", RM: "Romford",
  S: "Sheffield", SA: "Swansea", SE: "South East London", SG: "Stevenage",
  SK: "Stockport", SL: "Slough", SM: "Sutton", SN: "Swindon", SO: "Southampton",
  SP: "Salisbury", SR: "Sunderland", SS: "Southend-on-Sea", ST: "Stoke-on-Trent",
  SW: "South West London", SY: "Shrewsbury", TA: "Taunton", TD: "Galashiels",
  TF: "Telford", TN: "Tunbridge Wells", TQ: "Torquay", TR: "Truro", TS: "Cleveland",
  TW: "Twickenham", UB: "Southall", W: "West London", WA: "Warrington",
  WC: "West Central London", WD: "Watford", WF: "Wakefield", WN: "Wigan",
  WR: "Worcester", WS: "Walsall", WV: "Wolverhampton", YO: "York", ZE: "Lerwick",
};

interface Props {
  value: string | null;
  onChange: (value: string) => void;
}

export function PostcodeAreaSelect({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected: string[] = value
    ? value.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = Object.entries(UK_POSTCODE_AREAS).filter(([code, name]) => {
    const q = search.toLowerCase();
    return (
      !selected.includes(code) &&
      (code.toLowerCase().startsWith(q) || name.toLowerCase().includes(q))
    );
  });

  function add(code: string) {
    const next = [...selected, code];
    onChange(next.join(", "));
    setSearch("");
  }

  function remove(code: string) {
    const next = selected.filter((c) => c !== code);
    onChange(next.join(", "));
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {code} — {UK_POSTCODE_AREAS[code] ?? code}
              <button
                type="button"
                onClick={() => remove(code)}
                className="hover:text-destructive transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search area… e.g. LS, Manchester"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-lg text-sm">
            {filtered.slice(0, 30).map(([code, name]) => (
              <li key={code}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(code); }}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span className="font-bold text-primary w-8">{code}</span>
                  <span className="text-muted-foreground">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select postcode areas you cover — e.g. LS (Leeds), M (Manchester)
        </p>
      )}
    </div>
  );
}