import { useCallback, useEffect, useState } from 'react';
import { Armchair, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SeatLayoutEditor from '../components/SeatLayoutEditor';
import { cinemaApi } from '../lib/cinemaApi';

const AdminScreens = () => {
    const [screens, setScreens] = useState([]);
    const [selected, setSelected] = useState(null);
    const [editorVersion, setEditorVersion] = useState(0);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const loadScreens = useCallback(async () => {
        try {
            setScreens(await cinemaApi.listScreens());
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    }, []);

    useEffect(() => { loadScreens(); }, [loadScreens]);

    const newScreen = () => { setSelected(null); setEditorVersion(value => value + 1); setMessage(null); };
    const editScreen = screen => { setSelected(screen); setEditorVersion(value => value + 1); setMessage(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const saveScreen = async (name, seatConfiguration) => {
        setSaving(true);
        setMessage(null);
        try {
            const data = await cinemaApi.saveScreen({ name, seat_configuration: seatConfiguration }, selected?.id);
            setMessage({ type: 'success', text: selected ? 'Screen updated successfully.' : 'Screen created successfully.' });
            setSelected(data);
            await loadScreens();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteScreen = async screen => {
        if (!window.confirm(`Delete “${screen.name}”?`)) return;
        try {
            await cinemaApi.deleteScreen(screen.id);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Could not delete screen' });
            return;
        }
        if (selected?.id === screen.id) newScreen();
        setMessage({ type: 'success', text: 'Screen deleted.' });
        loadScreens();
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <main className="flex-1 p-8 min-w-0">
                <header className="flex flex-wrap justify-between items-center gap-4 mb-7"><div><h1 className="text-3xl font-bold">Cinema Screens</h1><p className="text-gray-400 mt-1">Create the cinema halls and seat maps customers use when booking.</p></div><button onClick={newScreen} className="btn-primary flex items-center gap-2"><Plus size={19} /> New Screen</button></header>
                {message && <div className={`p-4 rounded-xl border mb-6 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'}`}>{message.text}</div>}
                <SeatLayoutEditor key={`${selected?.id || 'new'}-${editorVersion}`} initialName={selected?.name || ''} initialLayout={selected?.seat_configuration || []} onSave={saveScreen} saving={saving} />
                <section className="mt-8"><h2 className="text-xl font-bold mb-4">Saved screens</h2>{screens.length === 0 ? <div className="glass-panel p-8 text-center text-gray-400">No screens saved yet.</div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{screens.map(screen => <article key={screen.id} className="glass-panel p-5 flex items-center gap-4"><span className="p-3 bg-primary/10 rounded-xl text-primary"><Armchair /></span><div className="min-w-0 flex-1"><h3 className="font-semibold truncate">{screen.name}</h3><p className="text-sm text-gray-400">{screen.seat_count} sellable seats</p></div><button onClick={() => editScreen(screen)} className="p-2 text-gray-400 hover:text-primary"><Pencil size={17} /></button><button onClick={() => deleteScreen(screen)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={17} /></button></article>)}</div>}</section>
            </main>
        </div>
    );
};

export default AdminScreens;
