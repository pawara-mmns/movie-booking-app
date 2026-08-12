import { useState } from 'react';
import { CheckCircle, LoaderCircle } from 'lucide-react';
import clsx from 'clsx';

const SEAT_COLORS = {
    standard: 'bg-sky-500/35 hover:bg-sky-500/80',
    vip: 'bg-primary/55 hover:bg-primary',
    couple: 'bg-pink-500/55 hover:bg-pink-500/85',
    accessible: 'bg-emerald-500/45 hover:bg-emerald-500/80',
    blocked: 'bg-gray-800 cursor-not-allowed opacity-40',
    unavailable: 'bg-red-900/60 cursor-not-allowed text-white/20',
    selected: 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]',
};

const money = cents => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cents / 100);
const seatKey = (row, col) => `${row}-${col}`;
const rowLabel = index => {
    let label = '';
    let value = index + 1;
    while (value > 0) {
        value -= 1;
        label = String.fromCharCode(65 + (value % 26)) + label;
        value = Math.floor(value / 26);
    }
    return label;
};

const couplePairForRow = (row, col) => {
    if (row[col] !== 'couple') return null;
    let runStart = col;
    while (runStart > 0 && row[runStart - 1] === 'couple') runStart -= 1;
    const pairStart = runStart + Math.floor((col - runStart) / 2) * 2;
    return row[pairStart + 1] === 'couple' ? [pairStart, pairStart + 1] : null;
};

const SeatSelection = ({ layout, unavailableSeats = [], seatPrice, seatPrices = {}, onBookingChange, onSelectSeat, onReleaseSeat }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [pendingSeat, setPendingSeat] = useState('');

    const priceForType = type => Number(seatPrices[type] || seatPrices.standard || seatPrice || 0);

    const changeSelection = next => {
        const uniqueSeats = [...new Set(next)];
        const total = uniqueSeats.reduce((sum, id) => {
            const [row, col] = id.split('-').map(Number);
            return sum + priceForType(layout[row]?.[col]);
        }, 0);
        setSelectedSeats(uniqueSeats);
        onBookingChange({ seats: uniqueSeats, total });
    };

    const handleSeatClick = async (row, col, type) => {
        const couplePair = type === 'couple' ? couplePairForRow(layout[row], col) : null;
        if (type === 'couple' && !couplePair) return;

        const columns = couplePair || [col];
        const seatIds = columns.map(column => seatKey(row, column));
        const unavailable = seatIds.some(id => unavailableSeats.includes(id));
        if (type === 'blocked' || type === 'gap' || unavailable || pendingSeat) return;

        const isSelected = seatIds.some(id => selectedSeats.includes(id));
        setPendingSeat(seatIds[0]);

        if (isSelected) {
            try {
                if (onReleaseSeat) await Promise.all(columns.map(column => onReleaseSeat(row, column)));
                changeSelection(selectedSeats.filter(id => !seatIds.includes(id)));
            } catch (error) {
                window.alert(error.message || 'Could not release this seat');
            } finally {
                setPendingSeat('');
            }
            return;
        }

        const newSeatIds = seatIds.filter(id => !selectedSeats.includes(id));
        if (selectedSeats.length + newSeatIds.length > 6) {
            setPendingSeat('');
            window.alert('You can select up to 6 seats. A couple seat counts as 2 seats.');
            return;
        }

        const heldColumns = [];
        try {
            if (onSelectSeat) {
                for (const column of columns) {
                    await onSelectSeat(row, column);
                    heldColumns.push(column);
                }
            }
            changeSelection([...selectedSeats, ...newSeatIds]);
        } catch (error) {
            if (onReleaseSeat && heldColumns.length) {
                await Promise.allSettled(heldColumns.map(column => onReleaseSeat(row, column)));
            }
            window.alert(error.message || 'This couple seat is no longer available');
        } finally {
            setPendingSeat('');
        }
    };

    return (
        <div className="flex w-full flex-col items-center">
            <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-sm bg-sky-500/35" /> Standard · {money(priceForType('standard'))}</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-sm bg-primary/55" /> VIP · {money(priceForType('vip'))}</span>
                <span className="flex items-center gap-2"><i className="h-4 w-7 rounded-t-md bg-pink-500/55" /> Couple · {money(priceForType('couple') * 2)} / pair</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-sm bg-emerald-500/45" /> Accessible · {money(priceForType('accessible'))}</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-sm bg-green-500" /> Selected</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-sm bg-red-900/60" /> Unavailable</span>
            </div>
            <div className="mb-12 flex w-full max-w-3xl justify-center"><div className="flex h-16 w-3/4 items-center justify-center rounded-t-[50px] border-t-4 border-primary/30 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_-10px_30px_rgba(255,215,0,0.1)]"><span className="text-sm font-bold uppercase tracking-[0.5em] text-primary/60">Cinema Screen</span></div></div>
            <div className="flex w-full justify-center overflow-auto pb-8">
                <div className="min-w-max space-y-2 p-4">
                    {layout.map((layoutRow, row) => (
                        <div key={row} className="flex items-center justify-center gap-2">
                            <span className="w-6 text-xs font-semibold text-gray-500">{rowLabel(row)}</span>
                            {layoutRow.map((type, col) => {
                                if (type === 'gap') return <div key={seatKey(row, col)} className="w-9" />;

                                const couplePair = type === 'couple' ? couplePairForRow(layoutRow, col) : null;
                                if (couplePair && col === couplePair[1]) return null;
                                const invalidCouple = type === 'couple' && !couplePair;
                                const columns = couplePair || [col];
                                const seatIds = columns.map(column => seatKey(row, column));
                                const blocked = type === 'blocked' || invalidCouple;
                                const unavailable = seatIds.some(id => unavailableSeats.includes(id));
                                const selected = seatIds.some(id => selectedSeats.includes(id));
                                const pending = pendingSeat === seatIds[0];
                                let color = couplePair ? SEAT_COLORS.couple : (SEAT_COLORS[type] || SEAT_COLORS.standard);
                                if (blocked) color = SEAT_COLORS.blocked;
                                if (unavailable) color = SEAT_COLORS.unavailable;
                                if (selected) color = SEAT_COLORS.selected;
                                const seatName = couplePair
                                    ? `${rowLabel(row)}${couplePair[0] + 1} + ${rowLabel(row)}${couplePair[1] + 1}`
                                    : `${rowLabel(row)}${col + 1}`;

                                return (
                                    <button
                                        type="button"
                                        key={seatIds[0]}
                                        onClick={() => handleSeatClick(row, col, type)}
                                        disabled={blocked || unavailable || Boolean(pendingSeat && !pending)}
                                        className={clsx('relative flex h-9 items-center justify-center rounded-t-lg text-[10px] font-bold transition-all', couplePair ? 'w-20 border-x border-pink-300/20' : 'w-9', color, !blocked && !unavailable && !selected && 'hover:-translate-y-1')}
                                        title={`${seatName} · ${couplePair ? `Couple seat · ${money(priceForType('couple') * 2)} per pair` : money(priceForType(type))}`}
                                        aria-label={`${seatName}, ${couplePair ? 'couple seat for two people' : type}`}
                                    >
                                        {pending ? <LoaderCircle size={13} className="animate-spin" /> : selected ? <CheckCircle size={13} /> : couplePair ? <span>{couplePair[0] + 1} + {couplePair[1] + 1}</span> : <span className="opacity-70">{col + 1}</span>}
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
