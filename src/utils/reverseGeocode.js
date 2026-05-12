/**
 * Resolve coordinates to a human place label (client-side, no API key).
 * Uses OpenStreetMap Nominatim (detailed suburbs) with BigDataCloud as fallback.
 * Nominatim: low volume only — called on explicit user location actions.
 */

const NOMINATIM_UA = "WorkerZone/1.0 (https://github.com; mawaisacu@gmail.com)";

function trim(s) {
  return s && String(s).trim() ? String(s).trim() : "";
}

/** Build a readable label from Nominatim address object (deduped, fine-to-coarse). */
function labelFromNominatimAddress(addr) {
  if (!addr || typeof addr !== "object") return null;
  const line = [];
  const push = (x) => {
    const t = trim(x);
    if (!t) return;
    if (!line.some((y) => y.toLowerCase() === t.toLowerCase())) line.push(t);
  };
  push(addr.neighbourhood || addr.quarter);
  push(addr.suburb);
  push(addr.hamlet || addr.village);
  push(addr.city_district);
  push(addr.city || addr.town);
  push(addr.municipality);
  push(addr.district);
  push(addr.state);
  push(addr.country);
  if (line.length) return line.slice(0, 6).join(", ");
  return null;
}

async function nominatimReverseJson(lat, lng, lang = "en") {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  const accept = lang === "ur" ? "ur,en" : "en,ur";
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(la)}&lon=${encodeURIComponent(
    ln
  )}&format=jsonv2&zoom=18&addressdetails=1&accept-language=${encodeURIComponent(accept)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_UA },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function reverseNominatimPlaceName(lat, lng, lang = "en") {
  const data = await nominatimReverseJson(lat, lng, lang);
  if (!data) return null;
  const fromAddr = labelFromNominatimAddress(data.address);
  if (fromAddr) return fromAddr;
  const dn = trim(data.display_name);
  if (dn) return dn.split(",").slice(0, 5).map((s) => s.trim()).join(", ");
  return null;
}

/** City / area line and street line for signup & profile forms */
function addressFieldsFromNominatimAddr(addr) {
  if (!addr || typeof addr !== "object") return { locationCity: "", locationAddress: "" };

  const hn = trim(addr.house_number);
  const rd = trim(addr.road || addr.pedestrian || addr.residential || addr.path || addr.footway);
  const locationAddress = [hn, rd].filter(Boolean).join(" ").trim();

  const cityTokens = [];
  const pushUniq = (x) => {
    const t = trim(x);
    if (!t) return;
    if (!cityTokens.some((c) => c.toLowerCase() === t.toLowerCase())) cityTokens.push(t);
  };
  pushUniq(addr.neighbourhood || addr.quarter);
  pushUniq(addr.suburb);
  pushUniq(addr.hamlet || addr.village);
  pushUniq(addr.city_district);
  pushUniq(addr.city || addr.town || addr.municipality);
  pushUniq(addr.district || addr.county);
  pushUniq(addr.state);

  let locationCity = cityTokens.slice(0, 4).join(", ");
  if (!locationCity) {
    const lbl = labelFromNominatimAddress(addr);
    if (lbl) {
      const parts = lbl.split(",").map((s) => trim(s)).filter(Boolean);
      locationCity = parts.slice(0, 2).join(", ");
    }
  }

  let street = locationAddress;
  if (!street) {
    const amenityLine = trim(addr.amenity || addr.building || addr.retail || addr.office);
    if (amenityLine) street = amenityLine;
  }

  return { locationCity, locationAddress: street };
}

function addressFieldsFromBdc(data) {
  if (!data || typeof data !== "object") return { locationCity: "", locationAddress: "" };
  const locality = trim(data.locality);
  const city = trim(data.city);
  const village = trim(data.village);
  const region = trim(data.principalSubdivision);
  let locationCity = "";
  if (locality && city && locality.toLowerCase() !== city.toLowerCase()) locationCity = `${locality}, ${city}`;
  else locationCity = city || locality || village || region || "";

  if (region && locationCity && !locationCity.toLowerCase().includes(region.toLowerCase()) && !city) {
    locationCity = `${locationCity}, ${region}`;
  }

  const locationAddress = trim(data.line1) || "";
  return { locationCity, locationAddress };
}

function labelFromBigDataCloud(data) {
  const informative = Array.isArray(data.localityInfo?.informative) ? data.localityInfo.informative : [];
  const skipInf = new Set(["Asia", "Indian subcontinent", "Asia/Karachi"]);
  const micro = [...informative]
    .filter((x) => x?.name && !skipInf.has(x.name) && (x.order ?? 0) >= 10)
    .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
    .map((x) => trim(x.name))[0];

  const admins = Array.isArray(data.localityInfo?.administrative) ? data.localityInfo.administrative : [];
  const localAdmin = [...admins]
    .filter((a) => a?.name && (a.order ?? 0) >= 7)
    .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
    .map((a) => trim(a.name))
    .find((n) => n && n !== trim(data.city));

  const city = trim(data.city);
  const locality = trim(data.locality);
  const village = trim(data.village);
  const loc = locality || village;
  const region = trim(data.principalSubdivision);
  const country = trim(data.countryName);

  const parts = [];
  const fine = micro || (localAdmin && localAdmin !== city ? localAdmin : null) || (loc && loc !== city ? loc : null);

  if (fine && city && fine !== city) parts.push(fine, city);
  else if (fine) parts.push(fine);
  else if (city) parts.push(city);
  else if (loc) parts.push(loc);

  if (region && parts.length && !parts.includes(region)) parts.push(region);
  if (country && parts.length && !parts.includes(country)) parts.push(country);

  if (parts.length) return parts.slice(0, 5).join(", ");
  return country || null;
}

async function bdcReverseJson(lat, lng, lang = "en") {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  const localityLanguage = lang === "ur" ? "ur" : "en";

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      la
    )}&longitude=${encodeURIComponent(ln)}&localityLanguage=${encodeURIComponent(localityLanguage)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function reverseBigDataCloudPlaceName(lat, lng, lang = "en") {
  const data = await bdcReverseJson(lat, lng, lang);
  if (!data) return null;
  return labelFromBigDataCloud(data);
}

function labelScore(label) {
  if (!label) return 0;
  const n = label.split(",").length;
  const hasComma = n > 1 ? 2 : 0;
  return n * 3 + hasComma + Math.min(label.length, 80) / 80;
}

/**
 * Best-effort place name for map / GPS (prefers neighbourhood via Nominatim).
 */
export async function reverseGeocodePlaceName(lat, lng, lang = "en") {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  const fallback = `${la.toFixed(4)}, ${ln.toFixed(4)}`;

  const [nomi, bdc] = await Promise.all([
    reverseNominatimPlaceName(la, ln, lang).catch(() => null),
    reverseBigDataCloudPlaceName(la, ln, lang).catch(() => null),
  ]);

  const candidates = [nomi, bdc].filter(Boolean);
  if (!candidates.length) return fallback;

  candidates.sort((a, b) => labelScore(b) - labelScore(a));
  return candidates[0] || fallback;
}

/**
 * Split reverse geocode into profile fields: city/area vs street (Nominatim + BigDataCloud).
 */
export async function reverseGeocodeAddressFields(lat, lng, lang = "en") {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return { locationCity: "", locationAddress: "" };

  const [nomJson, bdcData] = await Promise.all([
    nominatimReverseJson(la, ln, lang).catch(() => null),
    bdcReverseJson(la, ln, lang).catch(() => null),
  ]);

  const fromN = nomJson?.address ? addressFieldsFromNominatimAddr(nomJson.address) : { locationCity: "", locationAddress: "" };
  const fromB = bdcData ? addressFieldsFromBdc(bdcData) : { locationCity: "", locationAddress: "" };

  let locationCity = fromN.locationCity || fromB.locationCity;
  if (fromN.locationCity && fromB.locationCity) {
    locationCity = fromN.locationCity.length >= fromB.locationCity.length ? fromN.locationCity : fromB.locationCity;
  }

  let locationAddress = fromN.locationAddress || fromB.locationAddress;

  if (!locationCity && bdcData) {
    const lbl = labelFromBigDataCloud(bdcData);
    if (lbl) {
      const parts = lbl.split(",").map((s) => trim(s)).filter(Boolean);
      locationCity = parts.slice(0, 2).join(", ");
    }
  }

  return { locationCity: trim(locationCity), locationAddress: trim(locationAddress) };
}

/**
 * Device GPS + structured address for forms. Returns null if denied/unsupported.
 */
export async function resolveDeviceLocationForForm(lang = "en") {
  if (!navigator.geolocation) return null;

  const coords = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
  });

  if (!coords) return null;

  const { locationCity, locationAddress } = await reverseGeocodeAddressFields(coords.lat, coords.lng, lang);
  return {
    lat: coords.lat,
    lng: coords.lng,
    locationCity,
    locationAddress,
  };
}
