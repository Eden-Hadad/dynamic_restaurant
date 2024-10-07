const db = require('../db');

const tableModel = {
  updateTable: (id, updatedData) => {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE tables SET x = ?, y = ? WHERE id = ?';
      db.query(sql, [updatedData.x, updatedData.y, id], (error, result) => {
        if (error) {
          console.error('Error updating table:', error);
          reject('Error updating table');
        } else {
          console.log('Table updated successfully');
          resolve(result);
        }
      });
    });
  },

  createTable: (tableData) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO tables (x, y, size, inside) VALUES (?, ?, ?, ?)';
      db.query(sql, [tableData.left, tableData.top, tableData.size, tableData.inside], (error, result) => {
        if (error) {
          console.error('Error creating table:', error);
          reject('Error creating table');
        } else {
          console.log('Table created successfully');
          resolve(result.insertId);
        }
      });
    });
  },

  deleteTable: (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM tables WHERE id = ?';
      db.query(sql, [id], (error, result) => {
        if (error) {
          console.error('Error deleting table:', error);
          reject('Error deleting table');
        } else {
          console.log('Table deleted successfully');
          resolve(result);
        }
      });
    });
  },

  getTablePositions: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.id, t.x, t.y, t.size, t.inside,
               CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END AS reserved
        FROM tables t
        LEFT JOIN reservations r ON t.id = r.table_id AND r.date = CURDATE()
      `;
      db.query(sql, (error, results) => {
        if (error) {
          console.error('Error fetching table positions:', error);
          reject('Error fetching table positions');
        } else {
          const tables = results.map(table => ({
            id: table.id,
            left: table.x, 
            top: table.y,  
            size: table.size,
            inside: table.inside === 1,
            reserved: table.reserved === 1
          }));
          resolve(tables);
        }
      });
    });
  },

  getAvailableTables: (location, date) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.id, t.x, t.y, t.size, t.inside,
               GROUP_CONCAT(r.date ORDER BY r.date ASC) AS reservations  -- Get all reservation times in a list
        FROM tables t
        LEFT JOIN reservations r ON t.id = r.table_id AND DATE(r.date) = DATE(?)  -- Only fetch reservations for the selected date
        WHERE t.inside = ?
        GROUP BY t.id
      `;
  
      const isInside = location === 'inside' ? 1 : 0;
      db.query(sql, [date, isInside], (error, results) => {
        if (error) {
          console.error('Error fetching available tables:', error);
          reject('Error fetching available tables');
        } else {
          const tables = results.map(table => ({
            id: table.id,
            left: table.x,
            top: table.y,
            size: table.size,
            inside: table.inside === 1,
            reservations: table.reservations ? table.reservations.split(',') : []  
          }));
          resolve(tables);
        }
      });
    });
  },  
  

  createReservation: ({ tableId, quantity, date, location, userId }) => {
    return new Promise((resolve, reject) => {
      const sqlCheck = `
        SELECT id FROM reservations
        WHERE table_id = ?
        AND location = ?
        AND (
          (? BETWEEN date AND DATE_ADD(date, INTERVAL 90 MINUTE))
          OR (DATE_ADD(?, INTERVAL 90 MINUTE) BETWEEN date AND DATE_ADD(date, INTERVAL 90 MINUTE))
        )
      `;
  
      db.query(sqlCheck, [tableId, location, date, date], (error, results) => {
        if (error) {
          console.error('Error checking reservations:', error);
          reject('Error checking reservations');
        } else if (results.length > 0) {
          reject('This table is already reserved during this time.');
        } else {
          const sqlInsert = 'INSERT INTO reservations (table_id, how_many, date, location, user_id) VALUES (?, ?, ?, ?, ?)';
          db.query(sqlInsert, [tableId, quantity, date, location, userId], (error, result) => {
            if (error) {
              console.error('Error creating reservation:', error);
              reject('Error creating reservation');
            } else {
              resolve(result);
            }
          });
        }
      });
    });
  },

  getUserReservations: (userId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r.id as reservationId, t.id as tableId, t.x, t.y, t.size, t.inside, r.date, r.how_many
        FROM reservations r
        JOIN tables t ON r.table_id = t.id
        WHERE r.user_id = ?
      `;
      db.query(sql, [userId], (error, results) => {
        if (error) {
          console.error('Error fetching user reservations:', error);
          reject('Error fetching user reservations');
        } else {
          console.log('Fetched user reservations:', results);
          resolve(results);
        }
      });
    });
  },

  deleteReservation: (reservationId) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM reservations WHERE id = ?';
      db.query(sql, [reservationId], (error, result) => {
        if (error) {
          console.error('Error deleting reservation:', error);
          reject('Error deleting reservation');
        } else {
          resolve(result);
        }
      });
    });
  }
};

module.exports = tableModel;
