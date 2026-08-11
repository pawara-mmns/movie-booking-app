import { supabase } from './supabase';

const failOnError = ({ error, data }) => {
    if (error) throw new Error(error.message);
    return data;
};

const seatCount = layout => (layout || []).flat().filter(seat => !['gap', 'blocked', 0].includes(seat)).length;
const POSTER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_POSTER_SIZE = 5 * 1024 * 1024;

export const cinemaApi = {
    async listAdminMovies() {
        return failOnError(await supabase.from('movies').select('*').order('title'));
    },

    async saveMovie(movie, id = null) {
        const query = id
            ? supabase.from('movies').update(movie).eq('id', id)
            : supabase.from('movies').insert(movie);
        return failOnError(await query.select().single());
    },

    async uploadMoviePoster(file) {
        if (!POSTER_TYPES.has(file.type)) {
            throw new Error('Poster must be a JPG, PNG, WebP, or AVIF image.');
        }
        if (file.size > MAX_POSTER_SIZE) {
            throw new Error('Poster image must be 5 MB or smaller.');
        }

        const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `posters/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
            .from('movie-posters')
            .upload(path, file, {
                cacheControl: '3600',
                contentType: file.type,
                upsert: false,
            });
        if (error) throw new Error(error.message);

        const { data } = supabase.storage.from('movie-posters').getPublicUrl(path);
        return data.publicUrl;
    },

    async deleteMovie(id) {
        failOnError(await supabase.from('movies').delete().eq('id', id));
    },

    async listScreens() {
        const data = failOnError(await supabase.from('screens').select('*').order('name'));
        return data.map(screen => ({ ...screen, seat_count: seatCount(screen.seat_configuration) }));
    },

    async saveScreen(screen, id = null) {
        const query = id
            ? supabase.from('screens').update(screen).eq('id', id)
            : supabase.from('screens').insert(screen);
        const data = failOnError(await query.select().single());
        return { ...data, seat_count: seatCount(data.seat_configuration) };
    },

    async deleteScreen(id) {
        failOnError(await supabase.from('screens').delete().eq('id', id));
    },

    async listShowtimes() {
        const data = failOnError(await supabase
            .from('showtimes')
            .select('*, movies!inner(title), screens!inner(name)')
            .order('start_time', { ascending: false }));
        return data.map(showtime => ({
            ...showtime,
            movie_title: showtime.movies.title,
            screen_name: showtime.screens.name,
        }));
    },

    async createShowtimes({ movieId, screenId, price, slots }) {
        const rows = slots.map(slot => ({
            movie_id: movieId,
            screen_id: screenId,
            price,
            ...slot,
        }));
        const data = failOnError(await supabase.from('showtimes').insert(rows).select('id'));
        return data.length;
    },

    async deleteShowtime(id) {
        failOnError(await supabase.from('showtimes').delete().eq('id', id));
    },

    async getCatalogFilters() {
        const now = new Date().toISOString();
        const data = failOnError(await supabase
            .from('showtimes')
            .select('start_time, movies!inner(genre), screens!inner(id,name)')
            .gte('start_time', now)
            .order('start_time'));
        return {
            genres: [...new Set(data.map(item => item.movies.genre).filter(Boolean))].sort(),
            screens: [...new Map(data.map(item => [item.screens.id, item.screens])).values()].sort((a, b) => a.name.localeCompare(b.name)),
            dates: [...new Set(data.map(item => item.start_time.slice(0, 10)))].sort(),
        };
    },

    async listNowShowing(filters) {
        let query = supabase
            .from('showtimes')
            .select('movie_id, start_time, screen_id, movies!inner(*)')
            .gte('start_time', new Date().toISOString());
        if (filters.screenId) query = query.eq('screen_id', Number(filters.screenId));
        if (filters.showDate) {
            const start = new Date(`${filters.showDate}T00:00:00`);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            query = query.gte('start_time', start.toISOString()).lt('start_time', end.toISOString());
        }
        const data = failOnError(await query);
        const movies = [...new Map(data.map(item => [item.movie_id, item.movies])).values()];
        const search = filters.search.trim().toLocaleLowerCase();
        return movies
            .filter(movie => !search || movie.title.toLocaleLowerCase().includes(search))
            .filter(movie => !filters.genre || movie.genre === filters.genre)
            .sort((a, b) => a.title.localeCompare(b.title));
    },

    async getMovie(movieId) {
        const movie = failOnError(await supabase.from('movies').select('*').eq('id', movieId).single());
        const showtimes = failOnError(await supabase
            .from('showtimes')
            .select('*, screens!inner(name)')
            .eq('movie_id', movieId)
            .gte('start_time', new Date().toISOString())
            .order('start_time'));
        return {
            ...movie,
            showtimes: showtimes.map(showtime => ({ ...showtime, screen_name: showtime.screens.name })),
        };
    },

    async getShowtime(showtimeId) {
        const showtime = failOnError(await supabase
            .from('showtimes')
            .select('*, movies!inner(title,poster_url), screens!inner(name,seat_configuration)')
            .eq('id', showtimeId)
            .single());
        const unavailable = failOnError(await supabase.rpc('get_unavailable_seats', { p_showtime_id: Number(showtimeId) }));
        const layout = showtime.screens.seat_configuration || [];
        const unavailableSeats = unavailable.map(seat => `${seat.seat_row}-${seat.seat_col}`);
        const totalSeats = seatCount(layout);
        return {
            ...showtime,
            movie_title: showtime.movies.title,
            poster_url: showtime.movies.poster_url,
            screen_name: showtime.screens.name,
            seat_configuration: layout,
            booked_seats: unavailableSeats,
            locked_seats: [],
            total_seats: totalSeats,
            available_seats: Math.max(0, totalSeats - unavailableSeats.length),
        };
    },

    async holdSeat(showtimeId, row, col) {
        failOnError(await supabase.rpc('hold_seat', {
            p_showtime_id: Number(showtimeId),
            p_seat_row: row,
            p_seat_col: col,
        }));
    },

    async releaseSeat(showtimeId, row, col) {
        failOnError(await supabase.rpc('release_seat', {
            p_showtime_id: Number(showtimeId),
            p_seat_row: row,
            p_seat_col: col,
        }));
    },

    async createBooking(showtimeId, seats) {
        return failOnError(await supabase.rpc('create_booking', {
            p_showtime_id: Number(showtimeId),
            p_seats: seats.map(seat => {
                const [row, col] = seat.split('-').map(Number);
                return { row, col };
            }),
        }));
    },

    async getDashboard() {
        const now = new Date().toISOString();
        const [customers, movies, activeShowtimes, bookings, tickets, recent] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
            supabase.from('movies').select('*', { count: 'exact', head: true }),
            supabase.from('showtimes').select('*', { count: 'exact', head: true }).gte('start_time', now),
            supabase.from('bookings').select('total_price').eq('status', 'CONFIRMED'),
            supabase.from('tickets').select('id, bookings!inner(status)', { count: 'exact', head: true }).eq('bookings.status', 'CONFIRMED'),
            supabase.from('bookings').select('id,booking_reference,total_price,status,created_at,profiles!inner(email),showtimes!inner(start_time,movies!inner(title))').order('created_at', { ascending: false }).limit(8),
        ]);
        [customers, movies, activeShowtimes, bookings, tickets, recent].forEach(failOnError);
        return {
            customers: customers.count || 0,
            movies: movies.count || 0,
            active_showtimes: activeShowtimes.count || 0,
            confirmed_bookings: bookings.data.length,
            tickets_sold: tickets.count || 0,
            revenue: bookings.data.reduce((sum, booking) => sum + booking.total_price, 0),
            recent_bookings: recent.data.map(booking => ({
                id: booking.id,
                reference: booking.booking_reference,
                customer_email: booking.profiles.email,
                movie_title: booking.showtimes.movies.title,
                showtime: booking.showtimes.start_time,
                total_price: booking.total_price,
                status: booking.status,
            })),
        };
    },
};
