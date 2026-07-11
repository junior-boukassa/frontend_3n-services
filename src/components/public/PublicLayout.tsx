import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isDemoMode } from '../../config/demo';
const links = [
  ['/', 'Accueil'],
  ['/vehicles', 'Véhicules'],
  ['/agencies', 'Agences'],
  ['/about', 'À propos'],
  ['/faq', 'FAQ'],
  ['/contact', 'Contact'],
] as const;
export function PublicLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');
  const navigate = useNavigate();
  const theme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.theme = next ? 'dark' : 'light';
  };
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl dark:bg-slate-950/90">
        {isDemoMode && <div className="bg-[#FF9500] px-4 py-1.5 text-center text-xs font-bold text-white">Mode démonstration · aucune opération réelle</div>}
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 font-black tracking-wide">
            <span className="text-xl leading-none text-brand-900 dark:text-white">three-<b className="text-brand-500">N</b><small className="mt-1 block text-[8px] tracking-[.35em]">SERVICES</small></span>
          </Link>
          <nav className="ml-10 hidden items-center gap-1 lg:flex">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-slate-800' : 'text-slate-600 hover:text-brand-600 dark:text-slate-300'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <button className="btn-secondary !p-2.5" onClick={theme} aria-label="Changer le thème">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <>
                <Link className="btn-secondary" to="/app/dashboard">
                  Tableau de bord
                </Link>
                <button
                  className="btn-primary"
                  onClick={() => void logout().then(() => navigate('/'))}
                >
                  <LogOut size={17} /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link className="btn-secondary" to="/login">
                  Connexion
                </Link>
                <Link className="btn-primary" to="/register">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="border-t p-4 lg:hidden">
            {links.map(([to, label]) => (
              <Link
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 font-medium"
                key={to}
                to={to}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2">
              {user ? (
                <Link className="btn-primary flex-1" to="/app/dashboard">
                  Tableau de bord
                </Link>
              ) : (
                <>
                  <Link className="btn-secondary flex-1" to="/login">
                    Connexion
                  </Link>
                  <Link className="btn-primary flex-1" to="/register">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      <Outlet />
      <PublicFooter />
    </div>
  );
}
export function PublicFooter() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-500">3N</span>3N
            SERVICES
          </div>
          <p className="mt-4 text-sm leading-6 text-white/55">
            Une plateforme transparente pour trouver et réserver un véhicule auprès d’agences
            professionnelles.
          </p>
        </div>
        <FooterCol
          title="Explorer"
          items={[
            ['/vehicles', 'Véhicules'],
            ['/agencies', 'Agences'],
            ['/about', 'À propos'],
          ]}
        />
        <FooterCol
          title="Aide"
          items={[
            ['/faq', 'FAQ'],
            ['/contact', 'Contact'],
            ['/login', 'Connexion'],
          ]}
        />
        <FooterCol
          title="Informations"
          items={[
            ['/terms', 'Conditions d’utilisation'],
            ['/privacy', 'Confidentialité'],
          ]}
        />
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} 3N Services. Tous droits réservés.
      </div>
    </footer>
  );
}
function FooterCol({ title, items }: { title: string; items: string[][] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map(([to, label]) => (
          <Link className="block text-sm text-white/55 hover:text-white" to={to} key={to}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
export function useSeo(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
    return () => {
      document.title = '3N Services';
    };
  }, [title, description]);
}
