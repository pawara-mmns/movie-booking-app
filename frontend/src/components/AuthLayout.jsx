import { ArrowLeft, Film, ShieldCheck, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, image, eyebrow, title, description }) => (
    <main className="min-h-dvh bg-[#090d14] text-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.75fr)]">
        <aside className="relative hidden min-h-dvh overflow-hidden border-r border-white/[0.07] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,13,20,0.58)_0%,rgba(9,13,20,0.42)_40%,#090d14_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_34%)]" />

            <Link to="/" className="relative z-10 flex w-fit items-center gap-3" aria-label="CineSphere home">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 text-slate-950"><Film size={22} strokeWidth={2.5} /></span>
                <span className="text-xl font-black tracking-[-0.04em]">Cine<span className="text-amber-400">Sphere</span></span>
            </Link>

            <div className="relative z-10 max-w-xl pb-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">{eyebrow}</p>
                <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-[-0.055em] xl:text-6xl">{title}</h1>
                <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">{description}</p>
                <div className="mt-9 flex flex-wrap gap-3 text-sm text-slate-300"><span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-md"><Ticket size={15} className="text-amber-400" /> Live seat selection</span><span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-md"><ShieldCheck size={15} className="text-amber-400" /> Secure booking</span></div>
            </div>
        </aside>

        <section className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-5 sm:px-8 sm:py-7 lg:px-12 xl:px-16">
            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-400/[0.07] blur-3xl" />
            <header className="relative z-10 flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-2.5 lg:hidden" aria-label="CineSphere home"><span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 text-slate-950"><Film size={18} /></span><span className="font-black tracking-[-0.03em]">Cine<span className="text-amber-400">Sphere</span></span></Link>
                <Link to="/" className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"><ArrowLeft size={16} /> <span className="hidden sm:inline">Back to</span> Home</Link>
            </header>

            <div className="relative z-10 flex flex-1 items-center justify-center py-8 sm:py-10">
                <div className="w-full max-w-md">{children}</div>
            </div>

            <footer className="relative z-10 text-center text-xs text-slate-600">© {new Date().getFullYear()} CineSphere. Better cinema nights.</footer>
        </section>
    </main>
);

export default AuthLayout;
