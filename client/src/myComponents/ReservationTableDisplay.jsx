import React from 'react';
import './ReservationTableDisplay.css';

const ReservationTableDisplay = ({ tables, onTableReservation }) => {
  return (
    <div className="resevation-dropzone-container">
      <div className="reservation-dropzone">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`table-item table-${table.size} ${table.reserved ? 'reserved' : ''} ${table.selected ? 'selected' : ''}`}
            style={{ left: `${table.left}px`, top: `${table.top}px`, position: 'absolute' }}
            onClick={() => !table.reserved && onTableReservation(table.id)}  
          >
            Table For {table.size}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReservationTableDisplay;
