import React, { useState } from 'react';
import { Save, Eraser, Armchair } from 'lucide-react';
import clsx from 'clsx';

const SEAT_TYPES = {
    STANDARD: { id: 'standard', label: 'Standard', color: 'bg-secondary/50', price: 10 },
    VIP: { id: 'vip', label: 'VIP', color: 'bg-primary', price: 20 },
    COUPLE: { id: 'couple', label: 'Couple', color: 'bg-accent', price: 25 },
    BLOCKED: { id: 'blocked', label: 'Blocked', color: 'bg-gray-800', price: 0 },
    GAP: { id: 'gap', label: 'Gap', color: 'bg-transparent', price: 0 },
};

const SeatLayoutEditor = () => {
    const [rows, setRows] = useState(10);
    const [cols, setCols] = useState(12);
    const [selectedType, setSelectedType] = useState('standard');
    const [layout, setLayout] = useState(() =>
        Array(10).fill().map(() => Array(12).fill('standard'))
    );

    const handleResize = () => {
        const newLayout = Array(rows).fill().map((_, r) =>
            Array(cols).fill().map((_, c) =>
                (layout[r] && layout[r][c]) ? layout[r][c] : 'standard'
            )
        );
        setLayout(newLayout);
    };

    const toggleSeat = (r, c) => {
        const newLayout = [...layout];
        if (newLayout[r][c] === selectedType) {
            newLayout[r][c] = 'gap'; // Toggle to gap if clicking same type
        } else {
            newLayout[r][c] = selectedType;
        }
        setLayout(newLayout);
    };

    const handleSave = () => {
        const minimalLayout = layout.map(row => row.join(',')); // Simple serialization
        console.log("Saved Layout:", minimalLayout);
        alert("Layout configuration saved! (Check Console)");
    };

    return (
        <div className="flex flex-col h-full bg-surface p-6 rounded-xl border border-white/5">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Armchair className="text-primary" />
                        Seat Layout Editor
                    </h2>
                    <p className="text-textMuted text-sm">Design the theater seating arrangement.</p>
                </div>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    Save Layout
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                {/* Controls - Left Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-4 space-y-4">
                        <h3 className="font-semibold text-white">Grid Dimensions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-textMuted block mb-1">Rows</label>
                                <input
                                    type="number"
                                    value={rows}
                                    onChange={(e) => setRows(Number(e.target.value))}
                                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-textMuted block mb-1">Cols</label>
                                <input
                                    type="number"
                                    value={cols}
                                    onChange={(e) => setCols(Number(e.target.value))}
                                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                        <button onClick={handleResize} className="w-full py-2 bg-surfaceHighlight hover:bg-white/10 text-white rounded-lg text-sm transition-colors">
                            Update Grid
                        </button>
                    </div>

                    <div className="glass-panel p-4 space-y-2">
                        <h3 className="font-semibold text-white mb-2">Seat Types</h3>
                        {Object.values(SEAT_TYPES).map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all border",
                                    selectedType === type.id
                                        ? "bg-white/10 border-primary text-white"
                                        : "border-transparent text-textMuted hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-sm ${type.id === 'gap' ? 'border border-white/20' : type.color}`} />
                                    <span>{type.label}</span>
                                </div>
                                <span className="text-xs opacity-50">{type.id === 'gap' ? '' : `$${type.price}`}</span>
                            </button>
                        ))}
                    </div>

                    <div className="glass-panel p-4">
                        <h3 className="font-semibold text-white mb-2">Summary</h3>
                        <div className="space-y-1 text-sm text-textMuted">
                            <div className="flex justify-between">
                                <span>Total Seats:</span>
                                <span className="text-white">{layout.flat().filter(s => s !== 'gap').length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Standard:</span>
                                <span className="text-white">{layout.flat().filter(s => s === 'standard').length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>VIP:</span>
                                <span className="text-white">{layout.flat().filter(s => s === 'vip').length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor - Main Panel */}
                <div className="lg:col-span-3 bg-background rounded-xl p-8 overflow-auto flex flex-col items-center justify-center relative border border-white/5 shadow-inner">
                    <div className="mb-12 w-3/4 h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full relative">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-textMuted text-xs uppercase tracking-[0.2em]">Screen</span>
                    </div>

                    <div
                        className="grid gap-2"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            width: `min(${cols * 40}px, 100%)`
                        }}
                    >
                        {layout.map((row, r) => (
                            row.map((seatType, c) => (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => toggleSeat(r, c)}
                                    className={clsx(
                                        "aspect-square rounded-t-lg transition-all hover:scale-110 focus:outline-none",
                                        seatType === 'gap' ? 'invisible' : SEAT_TYPES[seatType.toUpperCase()].color,
                                        seatType === 'standard' && 'hover:brightness-125',
                                        seatType === 'vip' && 'ring-1 ring-primary/50'
                                    )}
                                    title={`Row ${r + 1} Col ${c + 1} (${seatType})`}
                                >
                                </button>
                            ))
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatLayoutEditor;
