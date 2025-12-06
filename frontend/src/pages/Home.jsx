import React from 'react';
import { Play, Info, Calendar, MapPin } from 'lucide-react';
import CinemaMap from '../components/CinemaMap';
import { Link } from 'react-router-dom';

const HeroSection = () => (
    <div className="relative h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
        <img
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop"
            alt="Cinema Hero"
            className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 z-20 p-8 md:p-16 max-w-4xl">
            <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full mb-4 inline-block">
                Now Showing
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                Experience Cinema <br /> Like Never Before
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-xl">
                Immerse yourself in state-of-the-art sound and visuals at CineSphere.
                Book your tickets now for the latest blockbusters.
            </p>
            <div className="flex gap-4">
                <button className="btn-primary flex items-center gap-2">
                    <Play size={20} fill="currentColor" />
                    Book Now
                </button>
                <button className="px-6 py-2 border border-white/20 hover:bg-white/10 text-white rounded-lg font-semibold transition-all backdrop-blur-sm flex items-center gap-2">
                    <Info size={20} />
                    View Details
                </button>
            </div>
        </div>
    </div>
);

const MovieCard = ({ title, genre, rating, image }) => (
    <div className="group relative rounded-xl overflow-hidden cursor-pointer">
        <div className="aspect-[2/3] w-full">
            <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
            <span className="text-primary text-xs font-bold uppercase tracking-wider mb-2">{genre}</span>
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span>⭐ {rating}</span>
                <span>•</span>
                <span>2h 15m</span>
            </div>
            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg font-medium transition-colors">
                Get Tickets
            </button>
        </div>
    </div>
);

const Home = () => {
    const movies = [
        { id: 1, title: "Dune: Part Two", genre: "Sci-Fi / Epic", rating: "4.8", image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2670&auto=format&fit=crop" },
        { id: 2, title: "Oppenheimer", genre: "Drama / History", rating: "4.9", image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2670&auto=format&fit=crop" },
        { id: 3, title: "Blade Runner 2049", genre: "Sci-Fi / Thriller", rating: "4.7", image: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=2667&auto=format&fit=crop" },
        { id: 4, title: "Interstellar", genre: "Sci-Fi / Adventure", rating: "4.9", image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2613&auto=format&fit=crop" },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Navigation Overlay */}
            <nav className="absolute top-0 w-full z-50 p-6 flex justify-between items-center">
                <div className="text-2xl font-bold text-white tracking-tight">CineSphere</div>
                <div className="flex gap-6">
                    <Link to="/login" className="text-white/80 hover:text-white font-medium transition-colors">Login</Link>
                    <Link to="/register" className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg font-medium transition-all">
                        Sign Up
                    </Link>
                </div>
            </nav>

            <HeroSection />

            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Now Showing</h2>
                        <p className="text-textMuted">Watch the latest blockbusters at a cinema near you.</p>
                    </div>
                    <button className="text-primary hover:text-white transition-colors flex items-center gap-2 font-medium">
                        View All Movies <Calendar size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
                    {movies.map(movie => (
                        <MovieCard key={movie.id} {...movie} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">Our Locations</span>
                        <h2 className="text-4xl font-bold text-white mb-6">Find a Cinema Hall Near You</h2>
                        <p className="text-textMuted mb-8 text-lg leading-relaxed">
                            CineSphere gives you the ultimate movie-going experience across Sri Lanka.
                            Locate your nearest cinema, check showtimes, and book your favorite seats seamlessly.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Colombo City Centre", "Kandy City Centre", "Galle Fort", "Negombo Beach"
                            ].map((loc, i) => (
                                <div key={i} className="flex items-center gap-3 text-gray-300 p-4 rounded-lg bg-surface hover:bg-surfaceHighlight transition-colors cursor-pointer border border-white/5">
                                    <MapPin className="text-primary" size={20} />
                                    <span className="font-medium">{loc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20" />
                        <CinemaMap />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
