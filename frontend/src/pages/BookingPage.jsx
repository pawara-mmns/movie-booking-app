import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import { Loader } from 'lucide-react';

const BookingPage = () => {
    const { showtimeId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showtime, setShowtime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]); // Array of strings "r-c"
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Poll for updates? For now just fetch once
        const fetchShowtime = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/bookings/showtime/${showtimeId}`, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setShowtime(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchShowtime();

        // Poll every 5 seconds to update booked status (simple real-time)
        const interval = setInterval(fetchShowtime, 5000);
        return () => clearInterval(interval);
    }, [showtimeId, user]);

    const handleSeatClick = async (r, c) => {
        const seatLabel = `${r}-${c}`;
        const isBooked = showtime.booked_seats.includes(seatLabel);
        if (isBooked) return;

        // Toggle selection locally first? No, must lock first.
        // If already selected by me, deselect (unlock logic not impl in backend API yet, assume expiration or just ignore unlock for MVP)
        // Let's implement toggle: If in selectedSeats, remove it. Else lock it.

        if (selectedSeats.includes(seatLabel)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatLabel));
            return;
        }

        // Lock it
        try {
            const res = await fetch('http://localhost:8000/api/bookings/lock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ showtime_id: parseInt(showtimeId), row: r, col: c })
            });
            if (res.ok) {
                setSelectedSeats([...selectedSeats, seatLabel]);
            } else {
                const d = await res.json();
                alert(d.detail || "Seat unavailable");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBooking = async () => {
        setProcessing(true);
        try {
            // Convert strings "r-c" to [r, c]
            const seats = selectedSeats.map(s => s.split('-').map(Number));

            const res = await fetch('http://localhost:8000/api/bookings/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ showtime_id: parseInt(showtimeId), seats })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Booking Confirmed! Ref: ${data.reference}`);
                navigate('/dashboard');
            } else {
                alert("Booking Failed");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="text-white p-8">Loading...</div>;
    if (!showtime) return <div className="text-white p-8">Showtime not found</div>;

    const { seat_configuration, booked_seats, price } = showtime;

    return (
        <div className="min-h-screen bg-background text-white p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-2">{showtime.screen_name}</h1>
            <p className="text-gray-400 mb-8">Screen</p>

            <div className="w-full max-w-4xl bg-gray-900/50 p-8 rounded-xl border border-white/10 relative">
                {/* Screen Curve */}
                <div className="w-2/3 h-4 bg-white/20 mx-auto mb-12 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]"></div>

                <div className="flex flex-col gap-2 items-center">
                    {seat_configuration.map((row, r) => (
                        <div key={r} className="flex gap-2">
                            {row.map((val, c) => {
                                if (val === 0) return <div key={`${r}-${c}`} className="w-8 h-8"></div>;
                                const label = `${r}-${c}`;
                                const isBooked = booked_seats.includes(label);
                                const isSelected = selectedSeats.includes(label);

                                return (
                                    <button
                                        key={label}
                                        disabled={isBooked}
                                        onClick={() => handleSeatClick(r, c)}
                                        className={clsx(
                                            "w-8 h-8 rounded-t-lg transition-all text-xs flex items-center justify-center",
                                            isBooked ? "bg-red-900/50 text-red-500 cursor-not-allowed" :
                                                isSelected ? "bg-primary text-black shadow-[0_0_10px_#FFD700]" :
                                                    val === 2 ? "bg-purple-700 hover:bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
                                        )}
                                    >
                                        {isBooked ? 'X' : c + 1}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex items-center gap-8 bg-surface p-4 rounded-lg">
                <div className="text-right">
                    <p className="text-gray-400 text-sm">Selected</p>
                    <p className="text-xl font-bold">{selectedSeats.length} Seats</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-xl font-bold text-primary">${(selectedSeats.length * price / 100).toFixed(2)}</p>
                </div>
                <button
                    onClick={handleBooking}
                    disabled={selectedSeats.length === 0 || processing}
                    className="btn-primary flex items-center gap-2"
                >
                    {processing && <Loader className="animate-spin" />}
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

export default BookingPage;
