// src/utils/distance.js

/**
 * Tính khoảng cách đường chim bay giữa 2 toạ độ (Haversine formula)
 * @param {number} lat1 Vĩ độ điểm 1 (VD: Quán)
 * @param {number} lon1 Kinh độ điểm 1
 * @param {number} lat2 Vĩ độ điểm 2 (VD: Khách hàng)
 * @param {number} lon2 Kinh độ điểm 2
 * @returns {number} Khoảng cách được tính bằng Kilomet (km)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
    const toRadian = (degree) => (degree * Math.PI) / 180;
  
    const R = 6371; // Bán kính trái đất (km)
    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadian(lat1)) *
        Math.cos(toRadian(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Trả về số km
    return R * c;
  }
  
