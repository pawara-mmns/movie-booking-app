import React, { useState } from 'react';
import { Armchair, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const SEAT_PRICES = {
    standard: 1500,
    vip: 2500,
    couple: 4000
};

const SEAT_COLORS = {
    standard: 'bg-secondary/30 hover:bg-secondary/80',
    vip: 'bg-primary/50 hover:bg-primary',
    couple: 'bg-accent/50 hover:bg-accent',
    blocked: 'bg-gray-800 cursor-not-allowed',
    booked: 'bg-red-900/50 cursor-not-allowed text-white/20',
    selected: 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
};

const SeatSelection = ({ layout, bookedSeats = [], onBookingChange }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);

    const handleSeatClick = (r, c, type) => {
        if (type === 'blocked' || type === 'gap' || isBooked(r, c)) return;

        const seatId = `${r}-${c}`;
        let newSelection;

        if (selectedSeats.includes(seatId)) {
            newSelection = selectedSeats.filter(id => id !== seatId);
        } else {
            // Maximum 6 seats
            if (selectedSeats.length >= 6) {
                alert("You can only select up to 6 seats.");
                return;
            }
            newSelection = [...selectedSeats, seatId];
        }

        setSelectedSeats(newSelection);

        // Calculate total and pass back
        const total = newSelection.reduce((sum, id) => {
            const [row, col] = id.split('-').map(Number);
            const seatType = layout[row][col];
            return sum + (SEAT_PRICES[seatType] || 0);
        }, 0);

        onBookingChange({ seats: newSelection, total });
    };

    const isBooked = (r, c) => bookedSeats.includes(`${r}-${c}`);
    const isSelected = (r, c) => selectedSeats.includes(`${r}-${c}`);

    return (
        <div className="flex flex-col items-center w-full">
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-textMuted">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-secondary/30 border border-white/10" />
                    <span>Standard</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-primary/50 border border-white/10" />
                    <span>VIP</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-green-500" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-red-900/50" />
                    <span>Sold</span>
                </div>
            </div>

            {/* Screen */}
            <div className="perspective-1000 mb-12 w-full max-w-3xl flex justify-center">
                <div className="w-3/4 h-16 bg-gradient-to-b from-primary/10 to-transparent transform rotate-x-12 border-t-4 border-primary/30 rounded-t-[50px] shadow-[0_-10px_30px_rgba(255,215,0,0.1)] flex items-center justify-center">
                    <span className="text-primary/50 text-sm font-bold tracking-[0.5em] uppercase">Cinema Screen</span>
                </div>
            </div>

            {/* Seats */}
            <div className="overflow-auto w-full flex justify-center pb-8">
                <div className="grid gap-x-2 gap-y-2 p-4">
                    {layout.map((row, r) => (
                        <div key={r} className="flex gap-2 justify-center">
                            {row.map((type, c) => {
                                if (type === 'gap') return <div key={`${r}-${c}`} className="w-8" />;

                                const seatId = `${r}-${c}`;
                                const blocked = type === 'blocked';
                                const booked = isBooked(r, c);
                                const selected = isSelected(r, c);

                                let colorClass = SEAT_COLORS[type] || SEAT_COLORS.standard;
                                if (blocked) colorClass = SEAT_COLORS.blocked;
                                if (booked) colorClass = SEAT_COLORS.booked;
                                if (selected) colorClass = SEAT_COLORS.selected;

                                return (
                                    <button
                                        key={seatId}
                                        onClick={() => handleSeatClick(r, c, type)}
                                        disabled={blocked || booked}
                                        className={clsx(
                                            "w-8 h-8 rounded-t-lg text-[10px] flex items-center justify-center transition-all duration-200 relative group",
                                            colorClass,
                                            !blocked && !booked && !selected && "hover:-translate-y-1"
                                        )}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50 pointer-events-none">
                                            {String.fromCharCode(65 + r)}{c + 1} - ${SEAT_PRICES[type]}
                                        </span>
                                        {selected && <CheckCircle size={12} />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeatSelection;
