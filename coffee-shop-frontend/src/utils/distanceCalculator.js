/**
 * Tiện ích hỗ trợ đo lường khoảng cách và giá cước vận chuyển
 * Sử dụng API mã nguồn mở: OpenStreetMap (Nominatim) & OSRM
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Geocode - Biến đổi Địa chỉ thành Tọa độ [Vĩ độ, Kinh độ]
 * @param {string} address - Chuỗi địa chỉ đầu vào 
 * @returns {Promise<[number, number] | null>} - Tọa độ [Lat, Lng] hoặc null nếu lỗi
 */
const performGeocode = async (queryStr) => {
  const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(queryStr)}&limit=1`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent": "CoffeeShopDeliveryApp/1.0"
    }
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
};

export const geocodeAddress = async (address) => {
  if (!address || address.trim().length < 5) return null;
  
  let cleanAddress = address.replace(/Việt Nam/gi, '').trim();
  let parts = cleanAddress.split(',').map(p => p.trim()).filter(Boolean);
  
  try {
    while (parts.length > 0) {
      const query = `${parts.join(', ')}, Việt Nam`;
      const coords = await performGeocode(query);
      if (coords) return coords;
      
      // Bỏ đi phần tử đầu tiên (thường là tên tòa nhà, số ngõ ngách cụ thể rất khó tìm) và thử lại
      parts.shift();
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
 * - 0 - 2km: 15,000đ
 * - Mỗi km tiếp theo: 5,000đ/km (Tính theo phân số của km)
 * @param {number} distanceMeters - Khoảng cách theo mét
 * @returns {number} - Phí giao hàng (làm tròn lên hàng nghìn)
 */
export const calculateShippingFee = (distanceMeters) => {
  const km = distanceMeters / 1000;
  let fee = 0;

  if (km <= 2) {
    fee = 15000;
  } else {
    fee = 15000 + (km - 2) * 5000;
  }

  // Làm tròn tới tiền nghìn (Ví dụ 16,345đ -> 16,000đ)
  return Math.round(fee / 1000) * 1000;
};
