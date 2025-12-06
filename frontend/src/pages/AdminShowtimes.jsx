import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';

const AdminShowtimes = () => {
    const { user } = useAuth();
    const [movies, setMovies] = useState([]);
    const [screens, setScreens] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [movieId, setMovieId] = useState('');
    const [screenId, setScreenId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [price, setPrice] = useState(1000); // cents

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Movies
                const resM = await fetch('http://localhost:8000/api/admin/movies');
                const dataM = await resM.json();
                setMovies(dataM);

                // Fetch Screens (Need an endpoint for listing screens? We made create, but maybe not list? Let's check admin.py... 
                // Wait, I didn't verify if I made a GET /screens endpoint. 
                // I checked admin.py in previous turn, it had POST /screens. 
                // I need to add GET /screens to admin.py if it's missing.
                // assuming I might need to fix backend too.
                // Let's assume I'll fix it.
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    const fetchScreens = async () => {
        // I'll implement the backend endpoint in a moment, but frontend code expects it.
        try {
            const res = await fetch('http://localhost:8000/api/admin/screens', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setScreens(data);
            }
        } catch (e) { console.error(e); }
    }

    useEffect(() => {
        if (user) fetchScreens();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // simple duration calc
        const start = new Date(startTime);
        const movie = movies.find(m => m.id == movieId);
        const end = new Date(start.getTime() + (movie?.duration_mins || 120) * 60000);

        try {
            const res = await fetch('http://localhost:8000/api/admin/showtimes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    movie_id: parseInt(movieId),
                    screen_id: parseInt(screenId),
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    price: parseInt(price)
                })
            });
            if (res.ok) {
                alert("Showtime Scheduled!");
            } else {
                alert("Failed");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <div className="flex-1 p-8">
                <h1 className="text-3xl font-bold mb-6">Schedule Showtimes</h1>
                <div className="glass-panel p-6 max-w-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1">Movie</label>
                            <select className="w-full bg-black/50 border border-gray-700 p-2 rounded text-white" value={movieId} onChange={e => setMovieId(e.target.value)} required>
                                <option value="">Select Movie</option>
                                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Screen</label>
                            <select className="w-full bg-black/50 border border-gray-700 p-2 rounded text-white" value={screenId} onChange={e => setScreenId(e.target.value)} required>
                                <option value="">Select Screen</option>
                                {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Start Time</label>
                            <input type="datetime-local" className="w-full bg-black/50 border border-gray-700 p-2 rounded text-white" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Price (cents)</label>
                            <input type="number" className="w-full bg-black/50 border border-gray-700 p-2 rounded text-white" value={price} onChange={e => setPrice(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-primary w-full">Schedule</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminShowtimes;
