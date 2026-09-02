import type { LanguageCode, TranslationKey } from "@/providers/language-provider";

export type ProvinceId =
  | "punjab"
  | "sindh"
  | "kp"
  | "balochistan"
  | "ict"
  | "ajk"
  | "gb";

export type District = {
  /** Stable slug used as the weather cache key and stored on the profile. */
  id: string;
  en: string;
  ur: string;
  province: ProvinceId;
  latitude: number;
  longitude: number;
};

export const PROVINCE_LABEL_KEYS: Record<ProvinceId, TranslationKey> = {
  punjab: "provincePunjab",
  sindh: "provinceSindh",
  kp: "provinceKhyberPakhtunkhwa",
  balochistan: "provinceBalochistan",
  ict: "provinceIslamabad",
  ajk: "provinceAzadKashmir",
  gb: "provinceGilgitBaltistan",
};

/**
 * District centres for the areas Kisaan AI serves, weighted towards the
 * farming belts. Coordinates are the district headquarters, which is close
 * enough for a daily forecast, and they double as the fallback when a farmer
 * declines the location permission.
 */
export const DISTRICTS: District[] = [
  // Punjab
  { id: "attock", en: "Attock", ur: "اٹک", province: "punjab", latitude: 33.766, longitude: 72.36 },
  { id: "bahawalnagar", en: "Bahawalnagar", ur: "بہاولنگر", province: "punjab", latitude: 29.9931, longitude: 73.2536 },
  { id: "bahawalpur", en: "Bahawalpur", ur: "بہاولپور", province: "punjab", latitude: 29.3956, longitude: 71.6836 },
  { id: "bhakkar", en: "Bhakkar", ur: "بھکر", province: "punjab", latitude: 31.625, longitude: 71.0654 },
  { id: "chakwal", en: "Chakwal", ur: "چکوال", province: "punjab", latitude: 32.9328, longitude: 72.863 },
  { id: "chiniot", en: "Chiniot", ur: "چنیوٹ", province: "punjab", latitude: 31.72, longitude: 72.9789 },
  { id: "dera-ghazi-khan", en: "Dera Ghazi Khan", ur: "ڈیرہ غازی خان", province: "punjab", latitude: 30.0489, longitude: 70.6455 },
  { id: "faisalabad", en: "Faisalabad", ur: "فیصل آباد", province: "punjab", latitude: 31.418, longitude: 73.079 },
  { id: "gujranwala", en: "Gujranwala", ur: "گوجرانوالہ", province: "punjab", latitude: 32.1877, longitude: 74.1945 },
  { id: "gujrat", en: "Gujrat", ur: "گجرات", province: "punjab", latitude: 32.5731, longitude: 74.0789 },
  { id: "hafizabad", en: "Hafizabad", ur: "حافظ آباد", province: "punjab", latitude: 32.0712, longitude: 73.6895 },
  { id: "jhang", en: "Jhang", ur: "جھنگ", province: "punjab", latitude: 31.2781, longitude: 72.3317 },
  { id: "jhelum", en: "Jhelum", ur: "جہلم", province: "punjab", latitude: 32.9425, longitude: 73.7257 },
  { id: "kasur", en: "Kasur", ur: "قصور", province: "punjab", latitude: 31.1187, longitude: 74.45 },
  { id: "khanewal", en: "Khanewal", ur: "خانیوال", province: "punjab", latitude: 30.3017, longitude: 71.9321 },
  { id: "khushab", en: "Khushab", ur: "خوشاب", province: "punjab", latitude: 32.2961, longitude: 72.3517 },
  { id: "lahore", en: "Lahore", ur: "لاہور", province: "punjab", latitude: 31.5497, longitude: 74.3436 },
  { id: "layyah", en: "Layyah", ur: "لیّہ", province: "punjab", latitude: 30.9693, longitude: 70.9428 },
  { id: "lodhran", en: "Lodhran", ur: "لودھراں", province: "punjab", latitude: 29.5467, longitude: 71.6276 },
  { id: "mandi-bahauddin", en: "Mandi Bahauddin", ur: "منڈی بہاؤالدین", province: "punjab", latitude: 32.5861, longitude: 73.4917 },
  { id: "mianwali", en: "Mianwali", ur: "میانوالی", province: "punjab", latitude: 32.5839, longitude: 71.537 },
  { id: "multan", en: "Multan", ur: "ملتان", province: "punjab", latitude: 30.1575, longitude: 71.5249 },
  { id: "muzaffargarh", en: "Muzaffargarh", ur: "مظفرگڑھ", province: "punjab", latitude: 30.0736, longitude: 71.1805 },
  { id: "nankana-sahib", en: "Nankana Sahib", ur: "ننکانہ صاحب", province: "punjab", latitude: 31.4492, longitude: 73.7126 },
  { id: "narowal", en: "Narowal", ur: "نارووال", province: "punjab", latitude: 32.1015, longitude: 74.873 },
  { id: "okara", en: "Okara", ur: "اوکاڑہ", province: "punjab", latitude: 30.8138, longitude: 73.4534 },
  { id: "pakpattan", en: "Pakpattan", ur: "پاکپتن", province: "punjab", latitude: 30.34, longitude: 73.39 },
  { id: "rahim-yar-khan", en: "Rahim Yar Khan", ur: "رحیم یار خان", province: "punjab", latitude: 28.4202, longitude: 70.2952 },
  { id: "rajanpur", en: "Rajanpur", ur: "راجن پور", province: "punjab", latitude: 29.1044, longitude: 70.3301 },
  { id: "rawalpindi", en: "Rawalpindi", ur: "راولپنڈی", province: "punjab", latitude: 33.5651, longitude: 73.0169 },
  { id: "sahiwal", en: "Sahiwal", ur: "ساہیوال", province: "punjab", latitude: 30.6682, longitude: 73.1114 },
  { id: "sargodha", en: "Sargodha", ur: "سرگودھا", province: "punjab", latitude: 32.0836, longitude: 72.6711 },
  { id: "sheikhupura", en: "Sheikhupura", ur: "شیخوپورہ", province: "punjab", latitude: 31.7167, longitude: 73.985 },
  { id: "sialkot", en: "Sialkot", ur: "سیالکوٹ", province: "punjab", latitude: 32.4945, longitude: 74.5229 },
  { id: "toba-tek-singh", en: "Toba Tek Singh", ur: "ٹوبہ ٹیک سنگھ", province: "punjab", latitude: 30.9709, longitude: 72.4826 },
  { id: "vehari", en: "Vehari", ur: "وہاڑی", province: "punjab", latitude: 30.045, longitude: 72.35 },

  // Sindh
  { id: "badin", en: "Badin", ur: "بدین", province: "sindh", latitude: 24.656, longitude: 68.837 },
  { id: "dadu", en: "Dadu", ur: "دادو", province: "sindh", latitude: 26.7319, longitude: 67.7761 },
  { id: "ghotki", en: "Ghotki", ur: "گھوٹکی", province: "sindh", latitude: 28.004, longitude: 69.316 },
  { id: "hyderabad", en: "Hyderabad", ur: "حیدرآباد", province: "sindh", latitude: 25.396, longitude: 68.3578 },
  { id: "jacobabad", en: "Jacobabad", ur: "جیکب آباد", province: "sindh", latitude: 28.2769, longitude: 68.4514 },
  { id: "karachi", en: "Karachi", ur: "کراچی", province: "sindh", latitude: 24.8607, longitude: 67.0011 },
  { id: "khairpur", en: "Khairpur", ur: "خیرپور", province: "sindh", latitude: 27.5295, longitude: 68.7592 },
  { id: "larkana", en: "Larkana", ur: "لاڑکانہ", province: "sindh", latitude: 27.56, longitude: 68.2264 },
  { id: "mirpur-khas", en: "Mirpur Khas", ur: "میرپور خاص", province: "sindh", latitude: 25.5276, longitude: 69.0122 },
  { id: "nawabshah", en: "Nawabshah", ur: "نواب شاہ", province: "sindh", latitude: 26.2442, longitude: 68.41 },
  { id: "sanghar", en: "Sanghar", ur: "سانگھڑ", province: "sindh", latitude: 26.0468, longitude: 68.9483 },
  { id: "shikarpur", en: "Shikarpur", ur: "شکارپور", province: "sindh", latitude: 27.9556, longitude: 68.6382 },
  { id: "sukkur", en: "Sukkur", ur: "سکھر", province: "sindh", latitude: 27.7052, longitude: 68.8574 },
  { id: "tando-allahyar", en: "Tando Allahyar", ur: "ٹنڈو الہ یار", province: "sindh", latitude: 25.46, longitude: 68.719 },
  { id: "thatta", en: "Thatta", ur: "ٹھٹھہ", province: "sindh", latitude: 24.7475, longitude: 67.9235 },
  { id: "umerkot", en: "Umerkot", ur: "عمرکوٹ", province: "sindh", latitude: 25.3614, longitude: 69.736 },

  // Khyber Pakhtunkhwa
  { id: "abbottabad", en: "Abbottabad", ur: "ایبٹ آباد", province: "kp", latitude: 34.1558, longitude: 73.2194 },
  { id: "bannu", en: "Bannu", ur: "بنوں", province: "kp", latitude: 32.9889, longitude: 70.6056 },
  { id: "charsadda", en: "Charsadda", ur: "چارسدہ", province: "kp", latitude: 34.1682, longitude: 71.7307 },
  { id: "dera-ismail-khan", en: "Dera Ismail Khan", ur: "ڈیرہ اسماعیل خان", province: "kp", latitude: 31.8313, longitude: 70.9019 },
  { id: "kohat", en: "Kohat", ur: "کوہاٹ", province: "kp", latitude: 33.5869, longitude: 71.4414 },
  { id: "mansehra", en: "Mansehra", ur: "مانسہرہ", province: "kp", latitude: 34.33, longitude: 73.2 },
  { id: "mardan", en: "Mardan", ur: "مردان", province: "kp", latitude: 34.1989, longitude: 72.0231 },
  { id: "nowshera", en: "Nowshera", ur: "نوشہرہ", province: "kp", latitude: 34.0153, longitude: 71.9747 },
  { id: "peshawar", en: "Peshawar", ur: "پشاور", province: "kp", latitude: 34.0151, longitude: 71.5249 },
  { id: "swabi", en: "Swabi", ur: "صوابی", province: "kp", latitude: 34.1206, longitude: 72.4697 },
  { id: "swat", en: "Swat", ur: "سوات", province: "kp", latitude: 34.7795, longitude: 72.3614 },

  // Balochistan
  { id: "chaman", en: "Chaman", ur: "چمن", province: "balochistan", latitude: 30.921, longitude: 66.4517 },
  { id: "gwadar", en: "Gwadar", ur: "گوادر", province: "balochistan", latitude: 25.1264, longitude: 62.3225 },
  { id: "khuzdar", en: "Khuzdar", ur: "خضدار", province: "balochistan", latitude: 27.812, longitude: 66.61 },
  { id: "lasbela", en: "Lasbela", ur: "لسبیلہ", province: "balochistan", latitude: 25.8072, longitude: 66.6219 },
  { id: "loralai", en: "Loralai", ur: "لورالائی", province: "balochistan", latitude: 30.3705, longitude: 68.5977 },
  { id: "nasirabad", en: "Nasirabad", ur: "نصیر آباد", province: "balochistan", latitude: 28.59, longitude: 68.14 },
  { id: "quetta", en: "Quetta", ur: "کوئٹہ", province: "balochistan", latitude: 30.1798, longitude: 66.975 },
  { id: "sibi", en: "Sibi", ur: "سبی", province: "balochistan", latitude: 29.543, longitude: 67.8773 },
  { id: "turbat", en: "Turbat", ur: "تربت", province: "balochistan", latitude: 26.0031, longitude: 63.0544 },
  { id: "zhob", en: "Zhob", ur: "ژوب", province: "balochistan", latitude: 31.3411, longitude: 69.4487 },

  // Islamabad, Azad Kashmir and Gilgit-Baltistan
  { id: "islamabad", en: "Islamabad", ur: "اسلام آباد", province: "ict", latitude: 33.6844, longitude: 73.0479 },
  { id: "mirpur-ajk", en: "Mirpur", ur: "میرپور", province: "ajk", latitude: 33.1478, longitude: 73.7519 },
  { id: "muzaffarabad", en: "Muzaffarabad", ur: "مظفرآباد", province: "ajk", latitude: 34.37, longitude: 73.4711 },
  { id: "gilgit", en: "Gilgit", ur: "گلگت", province: "gb", latitude: 35.9208, longitude: 74.3144 },
  { id: "skardu", en: "Skardu", ur: "سکردو", province: "gb", latitude: 35.2971, longitude: 75.6337 },
];

/**
 * Lahore is used when a farmer declines the location
 * permission and does not pick a district either. Weather still renders, and
 * the "change location" button lets them correct it.
 */
export const DEFAULT_DISTRICT_ID = "lahore";

const DISTRICTS_BY_ID = new Map(DISTRICTS.map((district) => [district.id, district]));

export function getDistrict(id: string | null | undefined): District | null {
  return id ? DISTRICTS_BY_ID.get(id) ?? null : null;
}

export function getDefaultDistrict(): District {
  // Safe: DEFAULT_DISTRICT_ID is one of the ids above.
  return DISTRICTS_BY_ID.get(DEFAULT_DISTRICT_ID) as District;
}

export function getDistrictName(district: District, language: LanguageCode) {
  return language === "ur" ? district.ur : district.en;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceInKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const halfChord =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(halfChord)));
}

/**
 * Labels GPS coordinates with the closest district we know about. The forecast
 * itself still uses the exact coordinates; the district is only a human-readable
 * label and the shared cache key.
 */
export function findNearestDistrict(latitude: number, longitude: number) {
  let nearest = DISTRICTS[0];
  let shortest = Number.POSITIVE_INFINITY;

  for (const district of DISTRICTS) {
    const distance = distanceInKm({ latitude, longitude }, district);

    if (distance < shortest) {
      shortest = distance;
      nearest = district;
    }
  }

  return { district: nearest, distanceKm: shortest };
}

export function searchDistricts(query: string) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return DISTRICTS;
  }

  return DISTRICTS.filter(
    (district) =>
      district.en.toLowerCase().includes(needle) ||
      district.ur.includes(needle) ||
      district.id.includes(needle.replace(/\s+/g, "-")),
  );
}
