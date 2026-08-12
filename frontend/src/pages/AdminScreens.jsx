import { useCallback, useEffect, useState } from 'react';
import { Armchair, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SeatLayoutEditor from '../components/SeatLayoutEditor';
import { cinemaApi } from '../lib/cinemaApi';
import { notify } from '../lib/notifications';

const AdminScreens = () => {
    const [screens, setScreens] = useState([]);
    const [selected, setSelected] = useState(null);
    const [editorVersion, setEditorVersion] = useState(0);
    const [saving, setSaving] = useState(false);

    const loadScreens = useCallback(async () => {
        try {
            setScreens(await cinemaApi.listScreens());
        } catch (error) {
            notify.error(error, 'Could not load cinema screens.');
        }
    }, []);

    useEffect(() => { loadScreens(); }, [loadScreens]);

    const newScreen = () => {
        setSelected(null);
        setEditorVersion(value => value + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const editScreen = screen => {
        setSelected(screen);
        setEditorVersion(value => value + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveScreen = async (name, seatConfiguration) => {
        setSaving(true);
        try {
            const data = await cinemaApi.saveScreen({ name, seat_configuration: seatConfiguration }, selected?.id);
            notify.success(selected ? 'Screen updated successfully.' : 'Screen created successfully.');
            setSelected(data);
            await loadScreens();
        } catch (error) {
            notify.error(error, 'Could not save the cinema screen.');
        } finally {
            setSaving(false);
        }
    };

    const deleteScreen = async screen => {
        if (!window.confirm(`Delete “${screen.name}”?`)) return;
        try {
            await cinemaApi.deleteScreen(screen.id);
        } catch (error) {
            notify.error(error, 'Could not delete screen.');
            return;
        }
        if (selected?.id === screen.id) newScreen();
        notify.success('Screen deleted.');
        loadScreens();
    };

    return (
        <div className="flex min-h-screen bg-background text-white">
            <AdminSidebar />
            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Cinema setup</p>
                        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Screen &amp; Seat Layouts</h1>
                        <p className="mt-1 text-sm text-gray-400 sm:text-base">Design the same clear seat map customers will use when booking.</p>
                    </div>
                    <button onClick={newScreen} className="btn-primary flex items-center gap-2"><Plus size={19} /> New screen</button>
                </header>

                <SeatLayoutEditor key={`${selected?.id || 'new'}-${editorVersion}`} initialName={selected?.name || ''} initialLayout={selected?.seat_configuration || []} onSave={saveScreen} saving={saving} />

                <section className="mt-8">
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div><h2 className="text-xl font-bold">Saved screens</h2><p className="mt-1 text-sm text-slate-500">Open a screen to update its layout.</p></div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-400">{screens.length} total</span>
                    </div>
                    {screens.length === 0 ? (
                        <div className="glass-panel p-8 text-center text-gray-400">No screens saved yet.</div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {screens.map(screen => (
                                <article key={screen.id} className={`group flex items-center gap-4 rounded-2xl border p-4 transition-colors ${selected?.id === screen.id ? 'border-primary/45 bg-primary/[0.08]' : 'border-white/[0.07] bg-[#111824] hover:border-white/15'}`}>
                                    <span className="rounded-xl bg-primary/10 p-3 text-primary"><Armchair /></span>
                                    <div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{screen.name}</h3><p className="mt-1 text-sm text-gray-400">{screen.seat_count} sellable seats</p></div>
                                    <button aria-label={`Edit ${screen.name}`} title="Edit screen" onClick={() => editScreen(screen)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-primary"><Pencil size={17} /></button>
                                    <button aria-label={`Delete ${screen.name}`} title="Delete screen" onClick={() => deleteScreen(screen)} className="rounded-lg p-2 text-gray-400 hover:bg-red-400/10 hover:text-red-400"><Trash2 size={17} /></button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminScreens;
