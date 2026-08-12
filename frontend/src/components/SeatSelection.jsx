import { useState } from 'react';
import { Check, LoaderCircle, Monitor } from 'lucide-react';
import clsx from 'clsx';
import { notify } from '../lib/notifications';

const SEAT_STYLES = {
    standard: 'border-white/10 bg-sky-500 text-slate-950',
    vip: 'border-white/10 bg-amber-400 text-slate-950',
    couple: 'border-pink-300/25 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500 text-slate-950',
    accessible: 'border-white/10 bg-emerald-500 text-slate-950',
    blocked: 'cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500 opacity-55',
    unavailable: 'cursor-not-allowed border-red-500/20 bg-red-950/80 text-red-300/45',
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
                notify.error(error, 'Could not release this seat.');
            } finally {
                setPendingSeat('');
            }
            return;
        }

        const newSeatIds = seatIds.filter(id => !selectedSeats.includes(id));
        if (selectedSeats.length + newSeatIds.length > 6) {
            setPendingSeat('');
            notify.warning('You can select up to 6 seats. A couple seat counts as 2 seats.');
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
            notify.error(error, 'This seat is no longer available.');
        } finally {
            setPendingSeat('');
        }
    };

    return (
        <div className="flex w-full flex-col items-center">
            <div className="mb-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs font-medium text-slate-400 sm:text-sm">
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-sky-500" /> Standard · {money(priceForType('standard'))}</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-amber-400" /> VIP · {money(priceForType('vip'))}</span>
                <span className="flex items-center gap-2"><i className="h-4 w-7 rounded-t-md bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500" /> Couple · {money(priceForType('couple') * 2)} / pair</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-emerald-500" /> Accessible · {money(priceForType('accessible'))}</span>
                <span className="flex items-center gap-2"><i className="grid h-4 w-4 place-items-center rounded-t bg-sky-500 ring-2 ring-white"><Check size={10} className="text-slate-950" /></i> Selected</span>
                <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t border border-red-500/20 bg-red-950/80" /> Unavailable</span>
            </div>

            <div className="w-full overflow-x-auto pb-8">
                <div className="mx-auto flex w-full min-w-[560px] max-w-6xl flex-col items-center px-4">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/70"><Monitor size={13} /> Front of cinema</div>
                    <div className="relative mb-16 h-16 min-w-72 transition-[width] duration-300 ease-out" style={{ width: '74%' }}>
                        <div className="absolute inset-x-0 top-0 h-1.5 rounded-full bg-gradient-to-r from-amber-400/20 via-amber-300 to-amber-400/20 shadow-[0_0_28px_rgba(251,191,36,0.4)]" />
                        <div className="absolute inset-x-[7%] top-1 h-14 rounded-b-[50%] bg-gradient-to-b from-amber-300/[0.12] to-transparent" />
                        <span className="absolute inset-x-0 top-5 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Cinema screen</span>
                    </div>

                    <div className="space-y-2.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4 sm:p-6">
                        <div className="flex items-center gap-2 pl-8 text-[10px] font-semibold text-slate-600">
                            {layout[0]?.map((_, col) => <span key={col} className="w-8 text-center">{col + 1}</span>)}
                        </div>
                        {layout.map((layoutRow, row) => (
                            <div key={row} className="flex items-center gap-2">
                                <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-500">{rowLabel(row)}</span>
                                {layoutRow.map((type, col) => {
                                    if (type === 'gap') return <div key={seatKey(row, col)} className="h-8 w-8 shrink-0 rounded-t-[9px] border border-dashed border-slate-700" aria-hidden="true" />;

                                    const couplePair = type === 'couple' ? couplePairForRow(layoutRow, col) : null;
                                    if (couplePair && col === couplePair[1]) return null;
                                    const invalidCouple = type === 'couple' && !couplePair;
                                    const columns = couplePair || [col];
                                    const seatIds = columns.map(column => seatKey(row, column));
                                    const blocked = type === 'blocked' || invalidCouple;
                                    const unavailable = seatIds.some(id => unavailableSeats.includes(id));
                                    const selected = seatIds.some(id => selectedSeats.includes(id));
                                    const pending = pendingSeat === seatIds[0];
                                    let color = couplePair ? SEAT_STYLES.couple : (SEAT_STYLES[type] || SEAT_STYLES.standard);
                                    if (blocked) color = SEAT_STYLES.blocked;
                                    if (unavailable) color = SEAT_STYLES.unavailable;
                                    const seatName = couplePair
                                        ? `${rowLabel(row)}${couplePair[0] + 1} + ${rowLabel(row)}${couplePair[1] + 1}`
                                        : `${rowLabel(row)}${col + 1}`;

                                    return (
                                        <button
                                            type="button"
                                            key={seatIds[0]}
                                            onClick={() => handleSeatClick(row, col, type)}
                                            disabled={blocked || unavailable || Boolean(pendingSeat && !pending)}
                                            className={clsx(
                                                'group relative flex h-8 shrink-0 items-center justify-center border text-[9px] font-bold shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
                                                couplePair ? 'w-[72px] rounded-t-xl' : 'w-8 rounded-t-[9px]',
                                                color,
                                                !blocked && !unavailable && 'hover:-translate-y-0.5',
                                                selected && 'z-10 scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#090d14]',
                                            )}
                                            title={`${seatName} · ${couplePair ? `Couple seat · ${money(priceForType('couple') * 2)} per pair` : money(priceForType(type))}`}
                                            aria-label={`${seatName}, ${couplePair ? 'couple seat for two people' : type}`}
                                            aria-pressed={selected}
                                        >
                                            {pending ? <LoaderCircle size={13} className="animate-spin" /> : selected ? <Check size={13} strokeWidth={3} /> : couplePair ? <span>{couplePair[0] + 1} + {couplePair[1] + 1}</span> : <span>{col + 1}</span>}
                                        </button>
                                    );
                                })}
                                <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-500">{rowLabel(row)}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-7 text-center text-[11px] text-slate-500">Row A is closest to the screen · Select up to 6 seats</p>
                </div>
            </div>
        </div>
    );
};

export default SeatSelection;
