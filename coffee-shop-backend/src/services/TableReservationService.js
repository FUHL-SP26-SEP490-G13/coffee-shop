const TableReservationRepository = require('../repositories/TableReservationRepository');
const TableRepository = require('../repositories/TableRepository');

class TableReservationService {
  async createReservation(tableId, data) {
    // Verify table exists
    const table = await TableRepository.findById(tableId);
    if (!table || table.is_deleted) {
      throw new Error('Bàn không tồn tại');
    }

    if (table.status !== 'available' && table.status !== 'Trống') {
      throw new Error('Bàn hiện không trống để đặt');
    }

    // Insert Reservation
    const reservation = await TableReservationRepository.create({
      tableId: tableId,
      customerId: data.customerId || null,
      customerName: data.customerName,
      phone: data.phone,
      reservationTime: data.reservationTime,
      is_deleted: 0
    });

    // Update table status to reserved
    await TableRepository.update(tableId, { status: 'reserved' });

    return reservation;
  }
}

module.exports = new TableReservationService();
