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
