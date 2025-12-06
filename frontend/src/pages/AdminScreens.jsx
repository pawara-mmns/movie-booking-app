import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import SeatLayoutEditor from '../components/SeatLayoutEditor';
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
            <div className="flex-1 p-8 h-screen overflow-hidden flex flex-col">
                <h1 className="text-3xl font-bold mb-6">Screen Management</h1>
                <div className="flex-1 overflow-hidden">
                    <SeatLayoutEditor />
                </div>
            </div>
        </div>
    );
};

export default AdminScreens;
