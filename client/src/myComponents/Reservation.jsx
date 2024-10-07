import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from './Form';
import ReservationTableDisplay from './ReservationTableDisplay';
import './Reservation.css';

function Reservation({ user }) {
    const [tables, setTables] = useState([]);
    const [reservationDetails, setReservationDetails] = useState({
        quantity: 2,
        date: new Date().toISOString().split('T')[0], 
        location: 'inside', 
        userId: user.id,
        tableId: null
    });

    const navigate = useNavigate();

    const isTableReserved = (reservations, currentDate) => {
        return reservations.some(reservationTime => {
            const reservationDate = new Date(reservationTime);
            const currentReservationDate = new Date(currentDate);

          
            const timeDiff = Math.abs(reservationDate - currentReservationDate) / 60000;  
            return timeDiff <= 90; 
        });
    };

    const fetchTables = async () => {
        try {
            const response = await fetch(`/tables/available?location=${reservationDetails.location}&date=${reservationDetails.date}`);
            const data = await response.json();

            const updatedTables = data.map(table => ({
                ...table,
                reserved: isTableReserved(table.reservations, reservationDetails.date)
            }));

            setTables(updatedTables);
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    useEffect(() => {
        fetchTables();  
    }, [reservationDetails.date, reservationDetails.location]);

    const handleTableReservation = (tableId) => {
        setTables(tables.map(table =>
            table.id === tableId ? { ...table, selected: true } : { ...table, selected: false }
        ));
        setReservationDetails({
            ...reservationDetails,
            tableId
        });
    };

    const handleFormSubmit = async () => {
        try {
            const response = await fetch('/tables/reserve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationDetails),
            });
    
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to reserve the table.');
            }

            fetchTables();
            alert('Reservation successful!');
            setReservationDetails({ ...reservationDetails, tableId: null });
    
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className='reservation-container'>
            <h1 className='reservation-container-h1'>Make a Reservation</h1>
            <Form 
                userId={user.id} 
                onFormSubmit={handleFormSubmit} 
                reservationDetails={reservationDetails} 
                setReservationDetails={setReservationDetails} 
            />
            <button className='my-reservation-button' onClick={() => navigate('/my-reservations')}>
                My Reservations
            </button>
            <ReservationTableDisplay 
                tables={tables} 
                onTableReservation={handleTableReservation} 
            />
        </div>
    );
}

export default Reservation;
