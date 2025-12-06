import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const AdminScreens = () => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [rows, setRows] = useState(10);
    const [cols, setCols] = useState(15);
    const [layout, setLayout] = useState([]); // 2D array: 1=seat, 0=gap, 2=vip

    React.useEffect(() => {
        // Initialize layout
        const newLayout = Array(rows).fill().map(() => Array(cols).fill(1));
        setLayout(newLayout);
    }, [rows, cols]);

    const toggleSeat = (r, c) => {
        const newLayout = [...layout];
        newLayout[r][c] = (newLayout[r][c] + 1) % 3; // Cycle: 1(Reg) -> 2(VIP) -> 0(Gap)
        setLayout(newLayout);
    };

    const handleSave = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/screens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    name,
                    seat_configuration: layout
                })
            });
            if (res.ok) {
                alert("Screen saved!");
                setName('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <div className="flex-1 p-8">
                <h1 className="text-3xl font-bold mb-6">Screen Management</h1>

                <div className="glass-panel p-6 mb-8">
                    <div className="flex gap-4 mb-4 items-end">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Screen Name</label>
                            <input className="bg-black/50 border border-gray-700 p-2 rounded text-white" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IMAX Hall 1" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Rows</label>
                            <input type="number" className="bg-black/50 border border-gray-700 p-2 rounded text-white w-20" value={rows} onChange={e => setRows(parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Cols</label>
                            <input type="number" className="bg-black/50 border border-gray-700 p-2 rounded text-white w-20" value={cols} onChange={e => setCols(parseInt(e.target.value))} />
                        </div>
                        <button onClick={handleSave} className="btn-primary">Save Layout</button>
                    </div>
                </div>

                <div className="glass-panel p-8 overflow-auto flex justify-center">
                    <div className="flex flex-col gap-1">
                        <div className="w-full h-8 bg-white/10 rounded mb-8 flex items-center justify-center text-gray-400 text-sm uppercase tracking-widest">Screen</div>
                        {layout.map((row, r) => (
                            <div key={r} className="flex gap-1 justify-center">
                                {row.map((seat, c) => (
                                    <div
                                        key={`${r}-${c}`}
                                        onClick={() => toggleSeat(r, c)}
                                        className={clsx(
                                            "w-6 h-6 rounded-t-lg cursor-pointer transition-colors text-[8px] flex items-center justify-center",
                                            seat === 1 && "bg-gray-600 hover:bg-green-500",
                                            seat === 2 && "bg-primary text-black hover:bg-yellow-300",
                                            seat === 0 && "bg-transparent border border-white/5"
                                        )}
                                    >
                                        {seat !== 0 && c + 1}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex gap-4 justify-center text-sm text-gray-400">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-t bg-gray-600"></div> Regular</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-t bg-primary"></div> VIP</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/10"></div> Gap</div>
                </div>
            </div>
        </div>
    );
};

export default AdminScreens;
