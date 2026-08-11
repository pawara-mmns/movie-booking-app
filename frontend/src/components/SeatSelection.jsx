import { useState } from 'react';
import { CheckCircle, LoaderCircle } from 'lucide-react';
import clsx from 'clsx';

const SEAT_COLORS = {
    standard: 'bg-sky-500/35 hover:bg-sky-500/80',
    vip: 'bg-primary/55 hover:bg-primary',
    couple: 'bg-pink-500/45 hover:bg-pink-500/80',
    accessible: 'bg-emerald-500/45 hover:bg-emerald-500/80',
    blocked: 'bg-gray-800 cursor-not-allowed opacity-40',
    unavailable: 'bg-red-900/60 cursor-not-allowed text-white/20',
    selected: 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]',
};

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);

const SeatSelection = ({ layout, unavailableSeats = [], seatPrice, onBookingChange, onSelectSeat, onReleaseSeat }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [pendingSeat, setPendingSeat] = useState('');

    const changeSelection = next => {
        setSelectedSeats(next);
        onBookingChange({ seats: next, total: next.length * seatPrice });
    };

    const handleSeatClick = async (row, col, type) => {
        const seatId = `${row}-${col}`;
        if (type === 'blocked' || type === 'gap' || unavailableSeats.includes(seatId) || pendingSeat) return;

        if (selectedSeats.includes(seatId)) {
            setPendingSeat(seatId);
            try {
                if (onReleaseSeat) await onReleaseSeat(row, col);
                changeSelection(selectedSeats.filter(id => id !== seatId));
            } catch (error) {
                window.alert(error.message || 'Could not release seat');
            } finally {
                setPendingSeat('');
            }
            return;
        }

        if (selectedSeats.length >= 6) {
            window.alert('You can select up to 6 seats.');
            return;
        }
        setPendingSeat(seatId);
        try {
            if (onSelectSeat) await onSelectSeat(row, col);
            changeSelection([...selectedSeats, seatId]);
        } catch (error) {
            window.alert(error.message || 'This seat is no longer available');
        } finally {
            setPendingSeat('');
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-gray-400">
                <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-sky-500/35" /> Standard</span>
                <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-primary/55" /> VIP</span>
                <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-pink-500/45" /> Couple</span>
                <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-emerald-500/45" /> Accessible</span>
                <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-green-500" /> Selected</span>
                <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-sm bg-red-900/60" /> Unavailable</span>
            </div>
            <div className="mb-12 w-full max-w-3xl flex justify-center"><div className="w-3/4 h-16 bg-gradient-to-b from-primary/10 to-transparent border-t-4 border-primary/30 rounded-t-[50px] shadow-[0_-10px_30px_rgba(255,215,0,0.1)] flex items-center justify-center"><span className="text-primary/60 text-sm font-bold tracking-[0.5em] uppercase">Cinema Screen</span></div></div>
            <div className="overflow-auto w-full flex justify-center pb-8">
                <div className="space-y-2 p-4 min-w-max">
                    {layout.map((layoutRow, row) => <div key={row} className="flex gap-2 justify-center items-center"><span className="w-6 text-xs text-gray-500 font-semibold">{String.fromCharCode(65 + row)}</span>{layoutRow.map((type, col) => {
                        if (type === 'gap') return <div key={`${row}-${col}`} className="w-9" />;
                        const seatId = `${row}-${col}`;
                        const blocked = type === 'blocked';
                        const unavailable = unavailableSeats.includes(seatId);
                        const selected = selectedSeats.includes(seatId);
                        const pending = pendingSeat === seatId;
                        let color = SEAT_COLORS[type] || SEAT_COLORS.standard;
                        if (blocked) color = SEAT_COLORS.blocked;
                        if (unavailable) color = SEAT_COLORS.unavailable;
                        if (selected) color = SEAT_COLORS.selected;
                        return <button key={seatId} onClick={() => handleSeatClick(row, col, type)} disabled={blocked || unavailable || Boolean(pendingSeat && !pending)} className={clsx('w-9 h-9 rounded-t-lg text-[10px] flex items-center justify-center transition-all relative group', color, !blocked && !unavailable && !selected && 'hover:-translate-y-1')} title={`${String.fromCharCode(65 + row)}${col + 1} · ${money(seatPrice)}`}>{pending ? <LoaderCircle size={13} className="animate-spin" /> : selected ? <CheckCircle size={13} /> : <span className="opacity-70">{col + 1}</span>}</button>;
                    })}</div>)}
                </div>
            </div>
        </div>
    );
};

export default SeatSelection;
