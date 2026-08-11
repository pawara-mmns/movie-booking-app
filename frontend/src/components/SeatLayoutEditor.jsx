import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Brush,
    CheckSquare2,
    Grid3X3,
    Monitor,
    MousePointer2,
    RotateCcw,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import clsx from 'clsx';

const SEAT_TYPES = {
    standard: {
        label: 'Standard',
        description: 'Regular seating',
        color: 'bg-sky-500',
        softColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    },
    vip: {
        label: 'VIP',
        description: 'Premium seating',
        color: 'bg-amber-400',
        softColor: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    },
    couple: {
        label: 'Couple',
        description: 'Always adds 2 joined seats',
        color: 'bg-pink-500',
        softColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    },
    accessible: {
        label: 'Accessible',
        description: 'Easy-access seating',
        color: 'bg-emerald-500',
        softColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    blocked: {
        label: 'Blocked',
        description: 'Visible but unavailable',
        color: 'bg-slate-700',
        softColor: 'bg-slate-700/60 text-slate-300 border-slate-600',
    },
};

const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));
const seatKey = (row, col) => `${row}-${col}`;
const couplePairForRow = (row, col) => {
    if (row[col] !== 'couple') return null;
    let runStart = col;
    while (runStart > 0 && row[runStart - 1] === 'couple') runStart -= 1;
    const pairStart = runStart + Math.floor((col - runStart) / 2) * 2;
    return row[pairStart + 1] === 'couple' ? [pairStart, pairStart + 1] : null;
};

const ensureCouplePairs = layout => layout.map(row => row.map((seat, col) => {
    if (seat !== 'couple') return seat;
    return couplePairForRow(row, col) ? seat : 'standard';
}));

const expandWithCouplePartners = (layout, seatKeys) => {
    const expanded = new Set(seatKeys);
    seatKeys.forEach(key => {
        const [row, col] = key.split('-').map(Number);
        const pair = couplePairForRow(layout[row] || [], col);
        pair?.forEach(pairCol => expanded.add(seatKey(row, pairCol)));
    });
    return [...expanded];
};

const expandAsNewCouples = (layout, seatKeys) => {
    const expanded = new Set();
    const seatsByRow = new Map();
    seatKeys.forEach(key => {
        const [row, col] = key.split('-').map(Number);
        seatsByRow.set(row, [...(seatsByRow.get(row) || []), col]);
    });
    seatsByRow.forEach((columns, row) => {
        const sorted = [...new Set(columns)].sort((first, second) => first - second);
        for (let index = 0; index < sorted.length; index += 1) {
            const col = sorted[index];
            if (sorted[index + 1] === col + 1) {
                expanded.add(seatKey(row, col));
                expanded.add(seatKey(row, col + 1));
                index += 1;
            } else {
                const partner = col < layout[row].length - 1 ? col + 1 : col - 1;
                expanded.add(seatKey(row, col));
                if (partner >= 0) expanded.add(seatKey(row, partner));
            }
        }
    });
    return [...expanded];
};
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

const normalizeSeat = seat => ({ 0: 'gap', 1: 'standard', 2: 'vip' }[seat] || seat || 'gap');

const normalizeLayout = layout => {
    if (!Array.isArray(layout) || layout.length === 0) {
        return Array.from({ length: 8 }, () => Array(12).fill('standard'));
    }
    const columnCount = Math.max(1, ...layout.map(row => Array.isArray(row) ? row.length : 0));
    return ensureCouplePairs(layout.map(row => Array.from({ length: columnCount }, (_, col) => normalizeSeat(row?.[col]))));
};

const layoutsMatch = (first, second) => JSON.stringify(first) === JSON.stringify(second);

const SeatLayoutEditor = ({ initialName = '', initialLayout = [], onSave, saving = false }) => {
    const [name, setName] = useState(initialName);
    const [layout, setLayout] = useState(() => normalizeLayout(initialLayout));
    const [history, setHistory] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [lastSelected, setLastSelected] = useState(null);
    const [selectedType, setSelectedType] = useState('standard');
    const [tool, setTool] = useState('select');
    const [screenWidth, setScreenWidth] = useState(74);

    const rows = layout.length;
    const cols = layout[0]?.length || 1;
    const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
    const flatLayout = useMemo(() => layout.flat(), [layout]);
    const sellableCount = flatLayout.filter(seat => !['gap', 'blocked'].includes(seat)).length;
    const emptyCount = flatLayout.filter(seat => seat === 'gap').length;

    const commitLayout = useCallback(nextLayout => {
        setLayout(current => {
            if (layoutsMatch(current, nextLayout)) return current;
            setHistory(previous => [...previous, current].slice(-40));
            return nextLayout;
        });
    }, []);

    const undo = useCallback(() => {
        setHistory(previous => {
            if (!previous.length) return previous;
            const restored = previous[previous.length - 1];
            setLayout(restored);
            setSelectedSeats([]);
            setLastSelected(null);
            return previous.slice(0, -1);
        });
    }, []);

    useEffect(() => {
        const handleShortcut = event => {
            const target = event.target;
            const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                undo();
            }
            if (!typing && (event.key === 'Delete' || event.key === 'Backspace') && selectedSeats.length) {
                event.preventDefault();
                const selected = new Set(expandWithCouplePartners(layout, selectedSeats));
                commitLayout(layout.map((row, rowIndex) => row.map((seat, colIndex) => selected.has(seatKey(rowIndex, colIndex)) ? 'gap' : seat)));
            }
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [commitLayout, layout, selectedSeats, undo]);

    const resizeGrid = (nextRows, nextCols) => {
        const safeRows = clamp(Number(nextRows) || 1, 1, 30);
        const safeCols = clamp(Number(nextCols) || 1, 1, 40);
        const next = ensureCouplePairs(Array.from({ length: safeRows }, (_, row) =>
            Array.from({ length: safeCols }, (_, col) => layout[row]?.[col] || 'standard')));
        commitLayout(next);
        setSelectedSeats(current => current.filter(key => {
            const [row, col] = key.split('-').map(Number);
            return row < safeRows && col < safeCols;
        }));
    };

    const applyType = useCallback(type => {
        setSelectedType(type);
        if (!selectedSeats.length) return;
        const expanded = type === 'couple'
            ? expandAsNewCouples(layout, selectedSeats)
            : expandWithCouplePartners(layout, selectedSeats);
        const selected = new Set(expanded);
        commitLayout(ensureCouplePairs(layout.map((row, rowIndex) => row.map((seat, colIndex) =>
            selected.has(seatKey(rowIndex, colIndex)) ? type : seat))));
        setSelectedSeats(expanded);
    }, [commitLayout, layout, selectedSeats]);

    const deleteSelected = useCallback(() => {
        if (!selectedSeats.length) return;
        const expanded = expandWithCouplePartners(layout, selectedSeats);
        const selected = new Set(expanded);
        commitLayout(layout.map((row, rowIndex) => row.map((seat, colIndex) =>
            selected.has(seatKey(rowIndex, colIndex)) ? 'gap' : seat)));
        setSelectedSeats(expanded);
    }, [commitLayout, layout, selectedSeats]);

    const handleSeatClick = (row, col, event) => {
        const key = seatKey(row, col);
        if (tool === 'paint') {
            const currentPair = couplePairForRow(layout[row], col);
            const paintColumns = selectedType === 'couple'
                ? [col, col < cols - 1 ? col + 1 : col - 1]
                : currentPair || [col];
            const next = layout.map((items, rowIndex) => items.map((seat, colIndex) =>
                rowIndex === row && paintColumns.includes(colIndex) ? selectedType : seat));
            commitLayout(ensureCouplePairs(next));
            return;
        }

        const currentPair = couplePairForRow(layout[row], col);
        if (currentPair) {
            const pairKeys = currentPair.map(pairCol => seatKey(row, pairCol));
            const pairSelected = pairKeys.every(pairKey => selectedSet.has(pairKey));
            setSelectedSeats(current => pairSelected ? current.filter(item => !pairKeys.includes(item)) : [...new Set([...current, ...pairKeys])]);
            setLastSelected(key);
            return;
        }

        if (event.shiftKey && lastSelected) {
            const [startRow, startCol] = lastSelected.split('-').map(Number);
            const minRow = Math.min(startRow, row);
            const maxRow = Math.max(startRow, row);
            const minCol = Math.min(startCol, col);
            const maxCol = Math.max(startCol, col);
            const range = [];
            for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
                for (let colIndex = minCol; colIndex <= maxCol; colIndex += 1) range.push(seatKey(rowIndex, colIndex));
            }
            setSelectedSeats(current => [...new Set([...current, ...range])]);
            return;
        }

        setSelectedSeats(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
        setLastSelected(key);
    };

    const selectAll = () => {
        setSelectedSeats(layout.flatMap((row, rowIndex) => row.map((seat, colIndex) => seatKey(rowIndex, colIndex))));
        setLastSelected(seatKey(0, 0));
    };

    const submit = () => {
        if (!name.trim()) {
            window.alert('Enter a cinema or screen name.');
            return;
        }
        if (!sellableCount) {
            window.alert('Add at least one sellable seat before saving.');
            return;
        }
        onSave(name.trim(), layout);
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111824] shadow-2xl shadow-black/20">
            <header className="flex flex-col gap-5 border-b border-white/[0.08] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-400"><Grid3X3 size={15} /> Visual layout builder</div>
                    <h2 className="mt-2 text-xl font-bold">{initialName ? `Editing ${initialName}` : 'Create a cinema screen'}</h2>
                    <p className="mt-1 text-sm text-slate-400">Build the exact seat map customers will see during booking.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={undo} disabled={!history.length} className="btn-secondary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40" title="Undo last layout change (Ctrl+Z)"><RotateCcw size={17} /> Undo</button>
                    <button type="button" onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2"><Save size={17} /> {saving ? 'Saving…' : initialName ? 'Update screen' : 'Save screen'}</button>
                </div>
            </header>

            <div className="grid xl:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="space-y-6 border-b border-white/[0.08] p-5 sm:p-6 xl:border-b-0 xl:border-r">
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Screen name</span>
                        <input className="input-field" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Colombo IMAX · Hall 1" />
                    </label>

                    <div>
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Grid size</h3><span className="text-xs text-slate-500">Updates live</span></div>
                        <div className="grid grid-cols-2 gap-3">
                            <label><span className="mb-1.5 block text-xs text-slate-400">Rows</span><input aria-label="Number of seat rows" type="number" min="1" max="30" value={rows} onChange={event => resizeGrid(event.target.value, cols)} className="input-field" /></label>
                            <label><span className="mb-1.5 block text-xs text-slate-400">Columns</span><input aria-label="Number of seat columns" type="number" min="1" max="40" value={cols} onChange={event => resizeGrid(rows, event.target.value)} className="input-field" /></label>
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Screen width</h3><span className="text-xs font-semibold text-amber-300">{screenWidth}%</span></div>
                        <input aria-label="Cinema screen preview width" type="range" min="40" max="100" step="2" value={screenWidth} onChange={event => setScreenWidth(Number(event.target.value))} className="w-full accent-amber-400" />
                        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-600"><span>Small</span><span>Wide</span></div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-bold">Editing tool</h3>
                        <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1.5">
                            <button type="button" onClick={() => setTool('select')} className={clsx('flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors', tool === 'select' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white')}><MousePointer2 size={16} /> Select</button>
                            <button type="button" onClick={() => setTool('paint')} className={clsx('flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors', tool === 'paint' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white')}><Brush size={16} /> Paint</button>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">Select multiple seats, or paint individual positions directly.</p>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-bold">Seat type</h3>
                        <div className="space-y-2">
                            {Object.entries(SEAT_TYPES).map(([id, type]) => (
                                <button type="button" key={id} onClick={() => applyType(id)} className={clsx('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all', selectedType === id ? type.softColor : 'border-transparent bg-white/[0.025] text-slate-400 hover:border-white/10 hover:text-white')}>
                                    <span className={clsx('h-5 w-5 shrink-0 rounded-t-md shadow-inner', type.color)} />
                                    <span className="min-w-0"><strong className="block text-sm">{type.label}</strong><span className="block truncate text-[11px] opacity-65">{type.description}</span></span>
                                </button>
                            ))}
                            <button type="button" onClick={deleteSelected} disabled={!selectedSeats.length} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-slate-400 transition-colors hover:border-red-400/25 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35"><span className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-current"><X size={12} /></span><span><strong className="block text-sm">Empty space</strong><span className="block text-[11px] opacity-65">Remove selected seats</span></span></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-black/20 py-3 text-center">
                        <div><strong className="block text-lg">{sellableCount}</strong><span className="text-[10px] uppercase tracking-wider text-slate-500">Seats</span></div>
                        <div><strong className="block text-lg">{selectedSeats.length}</strong><span className="text-[10px] uppercase tracking-wider text-slate-500">Selected</span></div>
                        <div><strong className="block text-lg">{emptyCount}</strong><span className="text-[10px] uppercase tracking-wider text-slate-500">Empty</span></div>
                    </div>
                </aside>

                <div className="min-w-0 bg-[#090e16]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Live customer preview</div>
                        <div className="flex flex-wrap items-center gap-2">
                            {tool === 'select' && <><button type="button" onClick={selectAll} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"><CheckSquare2 size={14} /> Select all</button><button type="button" onClick={() => { setSelectedSeats([]); setLastSelected(null); }} disabled={!selectedSeats.length} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-35"><X size={14} /> Clear</button><button type="button" onClick={deleteSelected} disabled={!selectedSeats.length} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-35"><Trash2 size={14} /> Delete</button></>}
                            {tool === 'paint' && <span className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400"><span className={clsx('h-3 w-3 rounded-t-sm', SEAT_TYPES[selectedType]?.color)} /> Painting {SEAT_TYPES[selectedType]?.label}</span>}
                        </div>
                    </div>

                    <div className="min-h-[620px] overflow-auto px-4 py-8 sm:px-8">
                        <div className="mx-auto flex min-w-max max-w-6xl flex-col items-center">
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/70"><Monitor size={13} /> Front of cinema</div>
                            <div className="relative mb-16 h-16 min-w-72 transition-[width] duration-300 ease-out" style={{ width: `${screenWidth}%` }}>
                                <div className="absolute inset-x-0 top-0 h-1.5 rounded-full bg-gradient-to-r from-amber-400/20 via-amber-300 to-amber-400/20 shadow-[0_0_28px_rgba(251,191,36,0.4)]" />
                                <div className="absolute inset-x-[7%] top-1 h-14 rounded-b-[50%] bg-gradient-to-b from-amber-300/[0.12] to-transparent" />
                                <span className="absolute inset-x-0 top-5 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Cinema screen</span>
                            </div>

                            <div className="space-y-2.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4 sm:p-6">
                                <div className="flex items-center gap-2 pl-8 text-[10px] font-semibold text-slate-600">
                                    {layout[0].map((_, colIndex) => <span key={colIndex} className="w-8 text-center">{colIndex + 1}</span>)}
                                </div>
                                {layout.map((row, rowIndex) => (
                                    <div key={rowIndex} className="flex items-center gap-2">
                                        <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-500">{rowLabel(rowIndex)}</span>
                                        {row.map((seat, colIndex) => {
                                            const key = seatKey(rowIndex, colIndex);
                                            const couplePair = couplePairForRow(row, colIndex);
                                            if (couplePair && colIndex === couplePair[1]) return null;
                                            const pairKeys = couplePair?.map(pairCol => seatKey(rowIndex, pairCol)) || [key];
                                            const selected = pairKeys.some(pairKey => selectedSet.has(pairKey));
                                            const isGap = seat === 'gap';
                                            const type = SEAT_TYPES[seat] || SEAT_TYPES.standard;
                                            return (
                                                <button
                                                    type="button"
                                                    key={key}
                                                    onClick={event => handleSeatClick(rowIndex, colIndex, event)}
                                                    className={clsx(
                                                        'group relative flex h-8 shrink-0 items-center justify-center border text-[9px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
                                                        couplePair ? 'w-[72px] rounded-t-xl bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500' : 'w-8 rounded-t-[9px]',
                                                        isGap ? 'border-dashed border-slate-700 bg-transparent text-slate-700 hover:border-slate-500 hover:text-slate-500' : couplePair ? 'border-pink-300/25 text-slate-950 shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5' : `${type.color} border-white/10 text-slate-950 shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5`,
                                                        selected && 'z-10 scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#090e16]',
                                                    )}
                                                    aria-label={couplePair ? `${rowLabel(rowIndex)}${couplePair[0] + 1} and ${rowLabel(rowIndex)}${couplePair[1] + 1}, Couple seat` : `${rowLabel(rowIndex)}${colIndex + 1}, ${isGap ? 'empty position' : type.label}`}
                                                    title={couplePair ? `${rowLabel(rowIndex)}${couplePair[0] + 1} + ${rowLabel(rowIndex)}${couplePair[1] + 1} · Couple seat` : `${rowLabel(rowIndex)}${colIndex + 1} · ${isGap ? 'Empty position' : type.label}`}
                                                >
                                                    {isGap ? <span className="opacity-0 transition-opacity group-hover:opacity-100">+</span> : couplePair ? `${couplePair[0] + 1} + ${couplePair[1] + 1}` : colIndex + 1}
                                                </button>
                                            );
                                        })}
                                        <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-500">{rowLabel(rowIndex)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
                                <span>Row A is closest to the screen</span><span className="hidden sm:inline">•</span><span>Select mode: click seats, Shift+click for a range</span><span className="hidden sm:inline">•</span><span>Ctrl+Z to undo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SeatLayoutEditor;
