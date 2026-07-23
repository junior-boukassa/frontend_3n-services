import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  Car,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Mail,
  Moon,
  BrainCircuit,
  Settings,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
const labels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  vehicles: 'Véhicules',
  bookings: 'Réservations',
  agencies: 'Agences',
  users: 'Utilisateurs',
  logs: 'Journal d’activités',
  profile: 'Mon profil',
  settings: 'Paramètres',
  help: 'Centre d’aide',
  pricing: 'Tarification intelligente',
};
export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');
  const nav = useNavigate();
  const loc = useLocation();
  const items = [
    [
      '/app/dashboard',
      user?.role === 'AGENCY'
        ? 'Tableau de bord agence'
        : user?.role === 'ADMIN'
          ? 'Tableau de bord global'
          : 'Tableau de bord',
      LayoutDashboard,
    ],
    [
      user?.role === 'CLIENT' ? '/vehicles' : '/app/vehicles',
      user?.role === 'CLIENT' ? 'Véhicules' : user?.role === 'AGENCY' ? 'Mes véhicules' : 'Véhicules',
      Car,
    ],
    [
      '/app/bookings',
      user?.role === 'CLIENT' ? 'Mes réservations' : user?.role === 'AGENCY' ? 'Réservations reçues' : 'Réservations',
      CalendarDays,
    ],
    ...(user?.role === 'AGENCY' || user?.role === 'ADMIN'
      ? ([['/app/pricing', 'Tarification intelligente', BrainCircuit]] as const)
      : []),
    ...(user?.role === 'ADMIN'
      ? ([
          ['/app/agencies', 'Agences', Building2],
          ['/app/users', 'Utilisateurs', Users],
          ['/app/logs', 'Journal d’activités', Activity],
          ['/admin/contact-messages', 'Messages reçus', Mail],
        ] as const)
      : []),
    ['/app/help', 'Centre d’aide', BookOpen],
    ['/app/settings', 'Paramètres', Settings],
  ] as const;
  const toggleTheme = () => {
    const n = !dark;
    setDark(n);
    document.documentElement.classList.toggle('dark', n);
    localStorage.theme = n ? 'dark' : 'light';
  };
  const current = labels[loc.pathname.split('/').pop() || 'dashboard'];
  return (
    <div className="min-h-screen">
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] flex-col bg-ink text-white transition-all lg:w-auto ${collapsed ? 'lg:w-20' : 'lg:w-64'} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-20 items-center gap-3 px-5">
          <div className="grid size-10 place-items-center rounded-xl bg-brand-500 font-black">
            3N
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold tracking-wide">3N SERVICES</p>
              <p className="text-xs text-white/50">Mobilité simplifiée</p>
            </div>
          )}
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white text-ink' : 'text-white/65 hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="m-3 hidden items-center gap-3 rounded-xl p-3 text-sm text-white/60 hover:bg-white/10 lg:flex"
        >
          <ChevronLeft className={collapsed ? 'rotate-180' : ''} />
          {!collapsed && 'Réduire le menu'}
        </button>
      </aside>
      <div className={`transition-all ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-cream/90 px-3 backdrop-blur-xl dark:bg-slate-950/90 sm:h-20 sm:px-7">
          <button className="mr-2 grid size-10 shrink-0 place-items-center rounded-xl lg:hidden sm:mr-4" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Espace / {current}</p>
            <h1 className="truncate text-sm font-bold min-[380px]:text-base sm:text-lg">{current}</h1>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              className="btn-secondary !p-2.5"
              onClick={toggleTheme}
              aria-label="Changer le thème"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => nav('/app/profile')}
              className="hidden items-center gap-3 rounded-xl p-2 hover:bg-white dark:hover:bg-slate-900 min-[420px]:flex sm:ml-1"
            >
              <div className="grid size-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                {user?.first_name?.[0] || user?.email[0].toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold">{user?.first_name || user?.email}</p>
                <p className="text-xs text-slate-500">{user?.role_display}</p>
              </div>
              <UserRound size={17} />
            </button>
            <button
              onClick={() => void logout()}
              className="btn-secondary !p-2.5"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="min-w-0 p-3 min-[380px]:p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
