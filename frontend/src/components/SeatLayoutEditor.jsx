import { useState } from 'react';
import { Armchair, Save } from 'lucide-react';
import clsx from 'clsx';

const SEAT_TYPES = {
    standard: { label: 'Standard', color: 'bg-secondary/50' },
    vip: { label: 'VIP', color: 'bg-primary' },
    couple: { label: 'Couple', color: 'bg-accent' },
    blocked: { label: 'Blocked', color: 'bg-gray-800' },
    gap: { label: 'Gap', color: 'bg-transparent' },
};

const normalizeLayout = layout => {
    if (!Array.isArray(layout) || layout.length === 0) return Array.from({ length: 8 }, () => Array(12).fill('standard'));
    return layout.map(row => row.map(seat => ({ 0: 'gap', 1: 'standard', 2: 'vip' }[seat] || seat)));
};

const SeatLayoutEditor = ({ initialName = '', initialLayout = [], onSave, saving = false }) => {
    const normalized = normalizeLayout(initialLayout);
    const [name, setName] = useState(initialName);
    const [rows, setRows] = useState(normalized.length);
    const [cols, setCols] = useState(normalized[0].length);
    const [selectedType, setSelectedType] = useState('standard');
    const [layout, setLayout] = useState(normalized);

    const resize = () => {
        const safeRows = Math.min(30, Math.max(1, rows));
        const safeCols = Math.min(40, Math.max(1, cols));
        setRows(safeRows);
        setCols(safeCols);
        setLayout(Array.from({ length: safeRows }, (_, row) => Array.from({ length: safeCols }, (_, col) => layout[row]?.[col] || 'standard')));
    };

    const paintSeat = (row, col) => {
        setLayout(current => current.map((items, rowIndex) => rowIndex === row ? items.map((seat, colIndex) => colIndex === col ? selectedType : seat) : items));
    };

    const submit = () => {
        if (!name.trim()) {
            window.alert('Enter a cinema or screen name.');
            return;
        }
        onSave(name.trim(), layout);
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-white/5">
            <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div><h2 className="text-xl font-bold flex items-center gap-2"><Armchair className="text-primary" /> Seat Layout Editor</h2><p className="text-gray-400 text-sm mt-1">Paint each seat type and save it to the database.</p></div>
                <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2"><Save size={18} /> {saving ? 'Saving...' : 'Save Screen'}</button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <aside className="space-y-5">
                    <div className="glass-panel p-4"><label className="text-sm text-gray-300 block mb-2">Cinema / screen name</label><input className="input-field" value={name} onChange={event => setName(event.target.value)} placeholder="Colombo IMAX Hall 1" /></div>
                    <div className="glass-panel p-4 space-y-4"><h3 className="font-semibold">Grid dimensions</h3><div className="grid grid-cols-2 gap-3"><label><span className="text-xs text-gray-400 block mb-1">Rows</span><input type="number" min="1" max="30" value={rows} onChange={event => setRows(Number(event.target.value))} className="input-field" /></label><label><span className="text-xs text-gray-400 block mb-1">Columns</span><input type="number" min="1" max="40" value={cols} onChange={event => setCols(Number(event.target.value))} className="input-field" /></label></div><button onClick={resize} className="btn-secondary w-full">Update grid</button></div>
                    <div className="glass-panel p-4 space-y-2"><h3 className="font-semibold mb-3">Seat types</h3>{Object.entries(SEAT_TYPES).map(([id, type]) => <button key={id} onClick={() => setSelectedType(id)} className={clsx('w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors', selectedType === id ? 'bg-white/10 border-primary text-white' : 'border-transparent text-gray-400 hover:bg-white/5')}><span className={clsx('w-4 h-4 rounded-sm', type.color, id === 'gap' && 'border border-white/30')} />{type.label}</button>)}</div>
                    <div className="glass-panel p-4 text-sm space-y-2"><div className="flex justify-between text-gray-400"><span>Sellable seats</span><strong className="text-white">{layout.flat().filter(seat => !['gap', 'blocked'].includes(seat)).length}</strong></div><div className="flex justify-between text-gray-400"><span>VIP seats</span><strong className="text-white">{layout.flat().filter(seat => seat === 'vip').length}</strong></div></div>
                </aside>
                <div className="lg:col-span-3 bg-background rounded-xl p-6 overflow-auto border border-white/5 min-h-[560px] flex flex-col items-center justify-center">
                    <div className="mb-12 w-3/4 h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-gray-500 text-xs uppercase tracking-[0.25em]">Screen</span></div>
                    <div className="space-y-2 min-w-max">{layout.map((row, rowIndex) => <div key={rowIndex} className="flex gap-2 justify-center">{row.map((seat, colIndex) => <button key={`${rowIndex}-${colIndex}`} onClick={() => paintSeat(rowIndex, colIndex)} title={`${String.fromCharCode(65 + rowIndex)}${colIndex + 1}: ${seat}`} className={clsx('w-8 h-8 rounded-t-lg transition-transform hover:scale-110 border border-white/5', SEAT_TYPES[seat]?.color || SEAT_TYPES.standard.color, seat === 'gap' && 'opacity-20 border-dashed')} />)}</div>)}</div>
                </div>
            </div>
        </div>
    );
};

export default SeatLayoutEditor;
