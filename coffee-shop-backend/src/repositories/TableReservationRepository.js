const BaseRepository = require('./BaseRepository');

class TableReservationRepository extends BaseRepository {
  constructor() {
    super('tableReservation');
  }

}

module.exports = new TableReservationRepository();
