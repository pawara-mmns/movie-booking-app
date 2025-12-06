import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', duration_mins: 120, poster_url: '', genre: '', rating: 'PG-13'
    });

    const fetchMovies = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/movies', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMovies(data);
            }
        } catch (error) {
            console.error("Failed to fetch movies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/api/admin/movies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchMovies();
                setShowForm(false);
                setFormData({ title: '', description: '', duration_mins: 120, poster_url: '', genre: '', rating: 'PG-13' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Movies</h1>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                        <Plus size={20} /> Add Movie
                    </button>
                </div>

                {showForm && (
                    <div className="glass-panel p-6 mb-8 animate-fade-in">
                        <h3 className="text-lg font-bold mb-4">Add New Movie</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <input className="bg-black/40 border border-gray-700 p-2 rounded text-white" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            <input className="bg-black/40 border-gray-700 p-2 rounded text-white" placeholder="Poster URL" value={formData.poster_url} onChange={e => setFormData({ ...formData, poster_url: e.target.value })} />
                            <input className="bg-black/40 border-gray-700 p-2 rounded text-white" placeholder="Genre" value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} />
                            <input type="number" className="bg-black/40 border-gray-700 p-2 rounded text-white" placeholder="Duration (min)" value={formData.duration_mins} onChange={e => setFormData({ ...formData, duration_mins: parseInt(e.target.value) })} />
                            <select className="bg-black/40 border-gray-700 p-2 rounded text-white" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })}>
                                <option value="G">G</option><option value="PG">PG</option><option value="PG-13">PG-13</option><option value="R">R</option>
                            </select>
                            <textarea className="col-span-2 bg-black/40 border-gray-700 p-2 rounded text-white" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <button type="submit" className="col-span-2 btn-secondary">Save Movie</button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {movies.map(movie => (
                        <div key={movie.id} className="glass-panel p-4 flex gap-4">
                            <img src={movie.poster_url || "https://via.placeholder.com/150"} className="w-24 h-36 object-cover rounded" alt={movie.title} />
                            <div>
                                <h3 className="font-bold text-lg">{movie.title}</h3>
                                <div className="text-sm text-gray-400 mt-1">{movie.genre} • {movie.duration_mins}m</div>
                                <span className="inline-block bg-gray-800 text-xs px-2 py-1 rounded mt-2">{movie.rating}</span>
                            </div>
                        </div>
                    ))}
                    {movies.length === 0 && !loading && <div className="col-span-full text-center text-gray-400">No movies found.</div>}
                </div>
            </div>
        </div>
    );
};

export default AdminMovies;
