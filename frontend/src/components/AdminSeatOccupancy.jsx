import { useEffect, useMemo } from 'react';
import { Armchair, CalendarClock, RefreshCw, X } from 'lucide-react';
import clsx from 'clsx';

const normalizeSeat = seat => typeof seat === 'string' ? seat : ({ 0: 'gap', 1: 'standard', 2: 'vip' }[seat] || 'standard');
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

const TYPE_COLORS = {
    standard: 'border-sky-400/25 bg-sky-500/35 text-sky-100',
    vip: 'border-amber-300/30 bg-amber-400/60 text-amber-950',
    couple: 'border-pink-300/30 bg-pink-500/55 text-white',
    accessible: 'border-emerald-300/30 bg-emerald-500/50 text-white',
    blocked: 'border-slate-700 bg-slate-800/60 text-slate-600',
};

const AdminSeatOccupancy = ({ data, loading, error, onClose, onRefresh }) => {
    useEffect(() => {
        const closeOnEscape = event => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    const layout = useMemo(() => (data?.seat_configuration || []).map(row => row.map(normalizeSeat)), [data]);
    const occupancyMap = useMemo(() => {
        const map = new Map();
        (data?.occupancy || []).forEach(item => {
            const key = seatKey(item.seat_row, item.seat_col);
            const current = map.get(key);
            if (!current || item.seat_status === 'BOOKED') map.set(key, item);
        });
        return map;
    }, [data]);
    const sellable = layout.flat().filter(type => !['gap', 'blocked'].includes(type)).length;
    const booked = [...occupancyMap.values()].filter(item => item.seat_status === 'BOOKED').length;
    const held = [...occupancyMap.values()].filter(item => item.seat_status === 'HELD').length;
    const available = Math.max(0, sellable - booked - held);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-label="Showtime seat occupancy" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d131d] shadow-2xl">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
                    <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Live hall occupancy</p><h2 className="mt-2 text-2xl font-black">{data?.movie_title || 'Loading showtime…'}</h2>{data && <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400"><span>{data.screen_name}</span><span className="flex items-center gap-1.5"><CalendarClock size={15} /> {new Date(data.start_time).toLocaleString()}</span></p>}</div>
                    <div className="flex items-center gap-2"><button type="button" onClick={onRefresh} disabled={loading} className="btn-secondary flex items-center gap-2 px-4"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button><button type="button" onClick={onClose} aria-label="Close occupancy viewer" className="rounded-full border border-white/10 p-2.5 text-slate-400 hover:bg-white/5 hover:text-white"><X size={20} /></button></div>
                </header>

                <div className="overflow-y-auto">
                    {error && <div className="m-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200 sm:m-7">{error}</div>}
                    {loading && !data ? <div className="flex min-h-96 items-center justify-center text-slate-400"><RefreshCw className="mr-3 animate-spin" /> Loading live seat data…</div> : data && <>
                        <div className="grid grid-cols-2 gap-3 px-5 pt-5 sm:grid-cols-4 sm:px-7 sm:pt-7">
                            {[['Available', available, 'text-emerald-300'], ['Booked', booked, 'text-red-300'], ['Held', held, 'text-violet-300'], ['Total seats', sellable, 'text-white']].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><strong className={clsx('block text-2xl', color)}>{value}</strong><span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span></div>)}
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 px-5 py-5 text-xs text-slate-400 sm:px-7">
                            <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-sky-500/35" /> Standard</span><span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-amber-400/60" /> VIP</span><span className="flex items-center gap-2"><i className="h-4 w-7 rounded-t bg-pink-500/55" /> Couple</span><span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-emerald-500/50" /> Accessible</span><span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-red-500" /> Booked</span><span className="flex items-center gap-2"><i className="h-4 w-4 rounded-t bg-violet-500" /> Held</span>
                        </div>

                        <div className="overflow-auto border-t border-white/[0.06] bg-[#080d14] px-4 py-8 sm:px-8">
                            <div className="mx-auto flex min-w-max flex-col items-center">
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70"><Armchair size={13} /> Front of cinema</div>
                                <div className="relative mb-14 h-14 w-3/4 min-w-72 max-w-3xl"><div className="absolute inset-x-0 top-0 h-1.5 rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]" /><div className="absolute inset-x-[8%] top-1 h-12 rounded-b-[50%] bg-gradient-to-b from-primary/10 to-transparent" /><span className="absolute inset-x-0 top-5 text-center text-[9px] font-bold uppercase tracking-[0.35em] text-slate-600">Cinema screen</span></div>
                                <div className="space-y-2.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4 sm:p-6">
                                    {layout.map((row, rowIndex) => <div key={rowIndex} className="flex items-center gap-2"><span className="w-6 text-center text-xs font-bold text-slate-500">{rowLabel(rowIndex)}</span>{row.map((type, colIndex) => {
                                        if (type === 'gap') return <span key={seatKey(rowIndex, colIndex)} className="h-8 w-8" />;
                                        const pair = couplePairForRow(row, colIndex);
                                        if (pair && colIndex === pair[1]) return null;
                                        const columns = pair || [colIndex];
                                        const occupied = columns.map(column => occupancyMap.get(seatKey(rowIndex, column))).filter(Boolean);
                                        const status = occupied.some(item => item.seat_status === 'BOOKED') ? 'BOOKED' : occupied.some(item => item.seat_status === 'HELD') ? 'HELD' : '';
                                        const detail = occupied.find(item => item.seat_status === status);
                                        const label = pair ? `${rowLabel(rowIndex)}${pair[0] + 1} + ${rowLabel(rowIndex)}${pair[1] + 1}` : `${rowLabel(rowIndex)}${colIndex + 1}`;
                                        const statusColor = status === 'BOOKED' ? 'border-red-300/40 bg-red-500 text-white' : status === 'HELD' ? 'border-violet-300/40 bg-violet-500 text-white' : TYPE_COLORS[type] || TYPE_COLORS.standard;
                                        const title = status ? `${label} · ${status} · ${detail?.customer_email || ''}${detail?.booking_reference ? ` · ${detail.booking_reference}` : ''}` : `${label} · ${type}`;
                                        return <span key={seatKey(rowIndex, colIndex)} title={title} className={clsx('flex h-8 shrink-0 items-center justify-center rounded-t-[9px] border text-[9px] font-bold shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)]', pair ? 'w-[72px]' : 'w-8', statusColor)}>{pair ? `${pair[0] + 1}+${pair[1] + 1}` : colIndex + 1}</span>;
                                    })}<span className="w-6 text-center text-xs font-bold text-slate-500">{rowLabel(rowIndex)}</span></div>)}
                                </div>
                                <p className="mt-5 text-xs text-slate-600">Hover a booked or held seat to view its customer and booking reference.</p>
                            </div>
                        </div>
                    </>}
                </div>
            </section>
        </div>
    );
};

export default AdminSeatOccupancy;
