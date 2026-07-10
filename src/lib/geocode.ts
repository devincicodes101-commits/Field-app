/** Pull a full UK postcode out of a free-text address string, or null if none found. */
export function extractPostcode(address: string): string | null {
  const m = address.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
  return m ? m[1].toUpperCase().replace(/\s+/g, " ") : null;
}

/**
 * Geocode a UK postcode to { lat, lng }. Uses getukaddress.com (getaddress.io) when
 * GETADDRESS_API_KEY is set; otherwise falls back to the free postcodes.io so radius
 * matching works out of the box. Returns null if the postcode can't be resolved.
 */
export async function geocodePostcode(pc: string): Promise<{ lat: number; lng: number } | null> {
  const clean = pc.trim();
  if (!clean) return null;
  const key = process.env.GETADDRESS_API_KEY;
  try {
    if (key) {
      const res = await fetch(
        `https://api.getaddress.io/find/${encodeURIComponent(clean)}?api-key=${encodeURIComponent(key)}`,
        { cache: "force-cache" }
      );
      if (res.ok) {
        const d = await res.json();
        if (typeof d.latitude === "number" && typeof d.longitude === "number") {
          return { lat: d.latitude, lng: d.longitude };
        }
      }
    }
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
      cache: "force-cache",
    });
    if (res.ok) {
      const d = await res.json();
      const r = d?.result;
      if (r && typeof r.latitude === "number" && typeof r.longitude === "number") {
        return { lat: r.latitude, lng: r.longitude };
      }
    }
  } catch {
    /* network/geocode failure -> caller treats as unresolved */
  }
  return null;
}

/** Great-circle distance in miles between two lat/lng points. */
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Outward postcode area (leading letters) from a free-text address, e.g. "…LS1 4AB" -> "LS". */
export function extractPostcodeArea(address: string): string | null {
  const m = address.match(/\b([A-Z]{1,2})\d/i);
  return m ? m[1].toUpperCase() : null;
}

export type Coverage = {
  coverage_type: string | null;
  coverage_radius_miles: number | null;
  coverage_postcodes: string | null;
  postcode: string | null;
};

/** Whether a contractor's coverage area includes the job at this address. */
export async function coverageCoversAddress(c: Coverage, address: string): Promise<boolean> {
  const type = c.coverage_type ?? "national";
  if (type === "national") return true;
  if (type === "postcode_list") {
    const area = extractPostcodeArea(address);
    if (!area) return false;
    const allowed = (c.coverage_postcodes ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    return allowed.some((a) => area.startsWith(a) || a.startsWith(area));
  }
  // radius
  if (!c.coverage_radius_miles || !c.postcode) return false;
  const jobPc = extractPostcode(address);
  if (!jobPc) return false;
  const [center, loc] = await Promise.all([geocodePostcode(c.postcode), geocodePostcode(jobPc)]);
  if (!center || !loc) return false;
  return milesBetween(center, loc) <= c.coverage_radius_miles;
}
