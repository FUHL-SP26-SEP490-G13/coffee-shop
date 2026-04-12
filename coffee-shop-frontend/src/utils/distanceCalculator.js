/**
 * Tiện ích hỗ trợ đo lường khoảng cách và giá cước vận chuyển
 * Sử dụng API mã nguồn mở: OpenStreetMap (Nominatim) & OSRM
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";
const HANOI_VIEWBOX = "105.28,21.35,106.03,20.8";
const MONEY_ROUNDING_UNIT = 100;
export const MAX_DELIVERY_DISTANCE_KM = 10;

const GEOCODE_STOP_WORDS = new Set([
  "viet",
  "nam",
  "việt",
  "ha",
  "noi",
  "hanoi",
  "thanh",
  "pho",
  "tp",
  "quan",
  "huyen",
  "xa",
  "phuong",
  "thon",
  "duong",
]);

const toAsciiLower = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const buildImportantTokens = (queryStr) =>
  toAsciiLower(queryStr)
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !GEOCODE_STOP_WORDS.has(word));

const scoreGeocodeCandidate = (candidate, tokens, referenceCoords) => {
  let score = 0;
  const candidateText = toAsciiLower(
    `${candidate.display_name || ""} ${candidate.address?.city || ""} ${candidate.address?.county || ""}`
  );

  if (candidateText.includes("ha noi") || candidateText.includes("hanoi")) {
    score += 8;
  }

  for (const token of tokens) {
    if (candidateText.includes(token)) {
      score += 1.4;
    }
  }

  if (referenceCoords && Array.isArray(referenceCoords) && referenceCoords.length === 2) {
    const [refLat, refLng] = referenceCoords;
    const straightKm =
      getHaversineDistance(refLat, refLng, candidate.lat, candidate.lng) / 1000;

    if (straightKm <= 5) score += 8;
    else if (straightKm <= 10) score += 6;
    else if (straightKm <= 20) score += 3;
    else if (straightKm <= 40) score += 1;
    else score -= Math.min(8, (straightKm - 40) / 8);
  }

  return score;
};

const stripAdministrativePrefix = (value) =>
  String(value || "")
    .replace(/\b(thành\s*phố|tp\.?|quận|huyện|xã|phường|thị\s*trấn|thôn)\b\s*/giu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const buildGeocodeQueries = (address) => {
  const cleanAddress = String(address || "").replace(/việt\s*nam/giu, "").trim();
  const parts = cleanAddress.split(",").map((part) => part.trim()).filter(Boolean);

  const queries = [];
  if (parts.length > 0) {
    queries.push(`${parts.join(", ")}, Việt Nam`);

    const strippedParts = parts.map(stripAdministrativePrefix);
    queries.push(`${strippedParts.join(", ")}, Việt Nam`);

    for (let i = 1; i < parts.length; i += 1) {
      queries.push(`${parts.slice(i).join(", ")}, Việt Nam`);
      queries.push(`${strippedParts.slice(i).join(", ")}, Việt Nam`);
    }
  }

  return [...new Set(queries.filter(Boolean))];
};

/**
 * Geocode - Biến đổi Địa chỉ thành Tọa độ [Vĩ độ, Kinh độ]
 * @param {string} address - Chuỗi địa chỉ đầu vào 
 * @returns {Promise<[number, number] | null>} - Tọa độ [Lat, Lng] hoặc null nếu lỗi
 */
const performGeocode = async (queryStr) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: queryStr,
    limit: "8",
    addressdetails: "1",
    dedupe: "1",
    countrycodes: "vn",
    bounded: "1",
    viewbox: HANOI_VIEWBOX,
  });

  const url = `${NOMINATIM_BASE_URL}?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent": "CoffeeShopDeliveryApp/1.0"
    }
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const candidates = data
    .map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      address: item.address || {},
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

  return candidates.length > 0 ? candidates : null;
};

export const geocodeAddress = async (address, options = {}) => {
  if (!address || address.trim().length < 5) return null;

  const queries = buildGeocodeQueries(address);
  const tokens = buildImportantTokens(address);
  const referenceCoords = options?.referenceCoords || null;
  let bestCandidate = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  
  try {
    for (const query of queries) {
      const candidates = await performGeocode(query);
      if (!candidates) continue;

      for (const candidate of candidates) {
        const score = scoreGeocodeCandidate(candidate, tokens, referenceCoords);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }
    }

    if (bestCandidate) {
      return [bestCandidate.lat, bestCandidate.lng];
    }

    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
};

/**
 * Hàm dự phòng: Đo lường khoảng cách đường thẳng (Haversine formula) nếu OSRM lỗi
 * Trả về kết quả dưới dạng: met (meters)
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Bán kính Trái Đất theo mét
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

/**
 * Tính quãng đường di chuyển bằng xe máy/ô tô qua OSRM
 * @param {[number, number]} origin - [Lat, Lng] điểm đi
 * @param {[number, number]} destination - [Lat, Lng] điểm đến
 * @returns {Promise<number>} - Khoảng cách thực tế (theo đơn vị Mét)
 */
export const getDrivingDistance = async (origin, destination) => {
  if (!origin || !destination) throw new Error("Thiếu tọa độ");

  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;

  try {
    // Lưu ý OSRM nhận vào dạng {Longitude},{Latitude}
    const url = `${OSRM_BASE_URL}/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("OSRM API failed");
    
    const data = await response.json();
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      return data.routes[0].distance; // mét
    }
    
    throw new Error("No route found");
  } catch (error) {
    console.warn("OSRM Routing Error, falling back to Haversine (straight line):", error);
    // Nếu API OSRM hỏng, dùng công thức đo đường thẳng nhân hệ số bù do đường zigzag (1.3x)
    return getHaversineDistance(lat1, lon1, lat2, lon2) * 1.3;
  }
};

/**
 * Tính giá cước vận chuyển dựa vào khoảng cách.
 * Quy tắc gía:
 * - 0 - 5km: 2,000đ/km
 * - Trên 5km: 1,500đ/km từ km thứ 6
 * - Từ 10km trở lên: không hỗ trợ đặt giao hàng
 * @param {number} distanceMeters - Khoảng cách theo mét
 * @returns {{isDeliverable: boolean, fee: number, distanceKm: number, exceededByKm: number}}
 */
export const getShippingQuote = (distanceMeters) => {
  const km = Math.max(0, Number(distanceMeters || 0) / 1000);

  if (km >= MAX_DELIVERY_DISTANCE_KM) {
    return {
      isDeliverable: false,
      fee: 0,
      distanceKm: km,
      exceededByKm: km - MAX_DELIVERY_DISTANCE_KM,
    };
  }

  const tierOneKm = Math.min(km, 5);
  const tierTwoKm = Math.max(0, km - 5);
  const fee = tierOneKm * 2000 + tierTwoKm * 1500;

  return {
    isDeliverable: true,
    fee: Math.round(fee / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT,
    distanceKm: km,
    exceededByKm: 0,
  };
};

export const calculateShippingFee = (distanceMeters) => getShippingQuote(distanceMeters).fee;
