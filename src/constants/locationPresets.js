import pakistanAdm2 from "./pakistanAdm2Districts.json";

/** Approximate map center for “all Pakistan” browse. */
export const PAKISTAN_COUNTRY = {
  id: "pakistan",
  lat: 30.3753,
  lng: 69.3451,
};

/** All Pakistan ADM2 districts from GeoNames (~157) — unique ids, centroid lat/lng. */
export const PAKISTAN_ADM2_DISTRICTS = pakistanAdm2;

/** Short list shown under “Popular”. */
export const PAKISTAN_QUICK_LOCATIONS = [
  { id: "lahore", lat: 31.5204, lng: 74.3587 },
  { id: "karachi", lat: 24.8607, lng: 67.0011 },
  { id: "islamabad", lat: 33.6844, lng: 73.0479 },
  { id: "rawalpindi", lat: 33.5651, lng: 73.0169 },
  { id: "faisalabad", lat: 31.4504, lng: 73.135 },
  { id: "multan", lat: 30.1575, lng: 71.5249 },
  { id: "peshawar", lat: 34.0151, lng: 71.5789 },
  { id: "quetta", lat: 30.1798, lng: 66.975 },
  { id: "sialkot", lat: 32.4945, lng: 74.5229 },
  { id: "gujranwala", lat: 32.1877, lng: 74.1945 },
];

/** @deprecated use PAKISTAN_QUICK_LOCATIONS */
export const PAKISTAN_POPULAR_CITIES = PAKISTAN_QUICK_LOCATIONS;
