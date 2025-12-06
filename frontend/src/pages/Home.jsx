import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

const Home = () => {
    const { user, logout } = useAuth();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch movies (Public API)
        fetch('http://localhost:8000/api/admin/movies')
            .then(res => res.json())
            .then(data => setMovies(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-background text-white p-8">
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                    <Film className="text-primary w-8 h-8" />
                    <h1 className="text-2xl font-bold">CineSphere</h1>
                </div>
                <div className="flex gap-4 items-center">
                    {user?.role === 'ADMIN' && <Link to="/admin" className="text-gray-300 hover:text-white">Admin Dashboard</Link>}
                    <button onClick={logout} className="text-red-400 hover:text-red-300">Logout</button>
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black font-bold">
                        {user?.token ? 'U' : '?'}
                    </div>
                </div>
            </header>

            <h2 className="text-4xl font-bold mb-8">Now Showing</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {movies.map(movie => (
                    <div key={movie.id} className="glass-panel overflow-hidden group hover:scale-105 transition-transform duration-300">
                        <div className="h-96 bg-gray-800 relative">
                            {movie.poster_url ? (
                                <img src={movie.poster_url} className="w-full h-full object-cover" alt={movie.title} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-600">No Poster</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-2xl font-bold">{movie.title}</h3>
                                <p className="text-primary">{movie.genre} • {movie.rating}</p>
                            </div>
                        </div>
                        <div className="p-4">
                            {/* In a real app we would list showtimes here. 
                                For now, link to a generic booking page or list available showtimes if we had an API for it.
                                We'll assume a dummy showtime ID=1 or link to a movie details page.
                                Let's link to a dummy showtime 1 for demo purposes if we don't have showtime list API.
                            */}
                            <Link to={`/booking/1`} className="block w-full btn-primary text-center">
                                Book Now
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {movies.length === 0 && !loading && (
                <div className="text-center py-20 text-gray-500">
                    No movies showing. Admin needs to add movies!
                </div>
            )}
        </div>
    );
};

export default Home;
