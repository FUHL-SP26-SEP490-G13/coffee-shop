const pool = require("../config/database");

class StaffDBRepository {
  async getOverview(userId) {
    // Đơn Takeaway đang chờ
    const [[takeaway]] = await pool.query(`
      SELECT COUNT(*) AS pending
      FROM orders
      WHERE order_type = 'takeaway' AND status = 'pending' AND DATE(created_at) = CURDATE()
    `);

    // Đơn Giao hàng chưa hoàn thành (chờ/đang chuẩn bị/đã xong nốt chờ giao)
    const [[delivery]] = await pool.query(`
      SELECT COUNT(*) AS waiting
      FROM orders
      WHERE order_type = 'delivery' AND status IN ('pending', 'preparing', 'served') AND DATE(created_at) = CURDATE()
    `);

    // Khu vực bếp: Món đang làm (tổng số lượng sản phẩm đang ở status preparing)
    // Hoặc tổng số đơn. Theo yêu cầu chung quy lại thường đếm đơn.
    // Nếu chữ "Món đang làm" -> SUM(quantity) of order_details is better. Let's do SUM.
    const [[kitchen]] = await pool.query(`
      SELECT IFNULL(SUM(od.quantity), 0) AS totalItems
      FROM orders o
      JOIN order_details od ON o.id = od.order_id
      WHERE o.status = 'preparing' AND DATE(o.created_at) = CURDATE()
    `);

    // Tình trạng ca làm
    const [[shift]] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM shift_registrations sr 
      JOIN shifts s ON sr.shift_id = s.id 
      WHERE sr.user_id = ? 
        AND s.shift_date = CURDATE() 
        AND sr.status IN ('registered', 'swapped_in')
    `, [userId]);

    return {
      takeawayPending: Number(takeaway?.pending || 0),
      deliveryWaiting: Number(delivery?.waiting || 0),
      kitchenPreparingItems: Number(kitchen?.totalItems || 0),
      shiftStatus: shift && shift.count > 0 ? "Sẵn sàng" : "Chưa xếp ca"
    };
  }
}

module.exports = new StaffDBRepository();
