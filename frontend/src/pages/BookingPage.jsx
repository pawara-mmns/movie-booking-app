import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SeatSelection from '../components/SeatSelection';
import { Loader } from 'lucide-react';

const BookingPage = () => {
    const { showtimeId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showtime, setShowtime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState({ seats: [], total: 0 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
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
    }, [showtimeId, user]);

    const handleBooking = async () => {
        if (bookingData.seats.length === 0) return;

        setProcessing(true);
        try {
            const seats = bookingData.seats.map(s => s.split('-').map(Number));

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

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>;
    if (!showtime) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Showtime not found</div>;

    // Fallback for legacy layout data (integers)
    const normalizedLayout = showtime.seat_configuration.map(row =>
        row.map(seat => {
            if (typeof seat === 'string') return seat; // Already new format
            // Map legacy integers
            if (seat === 0) return 'gap';
            if (seat === 1) return 'standard';
            if (seat === 2) return 'vip';
            return 'standard';
        })
    );

    return (
        <div className="min-h-screen bg-background text-white p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-2">{showtime.screen_name}</h1>
            <p className="text-textMuted mb-8">Select your seats</p>

            <SeatSelection
                layout={normalizedLayout}
                bookedSeats={showtime.booked_seats}
                onBookingChange={setBookingData}
            />

            <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-white/10 p-4 shadow-lg z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <p className="text-textMuted text-sm">Total Price</p>
                        <p className="text-2xl font-bold text-primary">${bookingData.total}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-textMuted text-sm">Selected Seats</p>
                            <p className="font-medium">{bookingData.seats.length > 0 ? bookingData.seats.join(', ') : 'None'}</p>
                        </div>
                        <button
                            onClick={handleBooking}
                            disabled={bookingData.seats.length === 0 || processing}
                            className="btn-primary flex items-center gap-2 px-8 py-3"
                        >
                            {processing ? <Loader className="animate-spin" /> : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Spacer for fixed footer */}
            <div className="h-24" />
        </div>
    );
};

export default BookingPage;
