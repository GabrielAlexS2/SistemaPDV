// Layout principal com sidebar de navegação
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import usePdvStore from '../store/pdvStore';
import {
  ShoppingCart, Package, LayoutDashboard,
  LogOut, Wifi, WifiOff, Store, Menu, X
} from 'lucide-react';

const navItems = [
  { to: '/pdv', icon: ShoppingCart, label: 'Caixa', desc: 'PDV' },
  { to: '/estoque', icon: Package, label: 'Estoque', desc: 'Produtos' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Relatórios' },
];

const Layout = () => {
  const { usuario, logout } = useAuthStore();
  const { vendaPendentes } = usePdvStore();
  const navigate = useNavigate();
  const isOnline = navigator.onLine;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLinks = ({ onClick }) => (
    <>
      {navItems.map(({ to, icon: Icon, label, desc }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center justify-center lg:justify-start md:gap-3 lg:p-3 p-4 rounded-xl transition-all group ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative shrink-0 flex items-center md:justify-center md:w-full lg:w-auto">
                <Icon size={24} className="md:w-5 md:h-5" />
                {/* Badge de vendas pendentes no ícone do caixa */}
                {to === '/pdv' && vendaPendentes > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 md:right-1/2 md:translate-x-3 lg:right-auto lg:translate-x-0 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {vendaPendentes > 9 ? '9+' : vendaPendentes}
                  </span>
                )}
              </div>
              <div className="block md:hidden lg:block ml-4 md:ml-0">
                <p className="font-medium text-lg md:text-sm">{label}</p>
                <p className={`text-sm md:text-xs ${isActive ? 'text-emerald-400/70' : 'text-slate-500'}`}>{desc}</p>
              </div>
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 overflow-hidden">
      
      {/* Mobile Topbar */}
      <header className="md:hidden bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Store size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">EstoquePDV</p>
            <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[120px]">{usuario?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-400 hover:text-white relative bg-slate-700/50 rounded-lg"
        >
          <Menu size={22} />
          {vendaPendentes > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-800"></span>
          )}
        </button>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-20 lg:w-56 bg-slate-800/80 border-r border-slate-700 flex-col shrink-0 transition-all z-20">
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
              <Store size={20} className="text-white" />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-white font-bold text-sm leading-none">EstoquePDV</p>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{usuario?.email}</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLinks />
        </nav>

        {/* Status de rede + Logout */}
        <div className="p-3 border-t border-slate-700 space-y-2">
          <div className={`flex items-center justify-center lg:justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            isOnline ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:inline text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Store size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-none">Menu</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
            <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-800/30">
            <div className={`flex items-center gap-3 p-4 rounded-xl font-medium ${
              isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              <span>Sistema {isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all bg-slate-800"
            >
              <LogOut size={20} className="shrink-0" />
              <span className="text-base font-medium">Sair da conta</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
