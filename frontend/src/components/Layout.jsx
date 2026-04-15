import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  CreditCard,
  BarChart3,
  LogOut,
  Tag,
  RotateCcw,
  Search,
  FileText,
  History,
  CalendarDays,
  Activity,
  Trophy,
  UserCheck,
  AlertTriangle,
  PieChart,
  ChevronDown,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X
} from 'lucide-react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

const MenuSection = ({ item, currentPath, collapsed, onNavigate }) => {
  const hasActiveChild = item.children?.some((child) => child.path === currentPath);
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  const [compactOpen, setCompactOpen] = useState(false);
  const [compactPosition, setCompactPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const compactMenuId = `compact-${item.title.replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => {
    if (!collapsed) {
      setCompactOpen(false);
      if (hasActiveChild) setIsOpen(true);
    }
  }, [collapsed, hasActiveChild]);

  useEffect(() => {
    setCompactOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!compactOpen) return;

    const closeCompact = () => setCompactOpen(false);
    const handleOutside = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (event.target.closest(`[data-compact-menu="${compactMenuId}"]`)) return;
      setCompactOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', closeCompact);
    window.addEventListener('scroll', closeCompact, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', closeCompact);
      window.removeEventListener('scroll', closeCompact, true);
    };
  }, [compactOpen, compactMenuId]);

  const toggleCompactMenu = () => {
    if (compactOpen) {
      setCompactOpen(false);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupTop = Math.max(12, Math.min(window.innerHeight - 230, rect.top - 4));
      setCompactPosition({ top: popupTop, left: rect.right + 12 });
    }

    setCompactOpen(true);
  };

  if (!item.children) {
    return (
      <Link
        to={item.path}
        onClick={onNavigate}
        title={collapsed ? item.title : undefined}
        className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-3 py-2 rounded-lg text-[12px] transition-all group ${
          currentPath === item.path
            ? 'bg-[#FCFAF5] text-[#2F2923] border border-[#D7CCBC] font-bold shadow-sm'
            : 'text-[#6E655B] hover:bg-[#F1EADF]/40 hover:text-[#2F2923]'
        }`}
      >
        <span className={`${currentPath === item.path ? 'text-[#C6A243]' : 'text-[#93887C] group-hover:text-[#C6A243]'}`}>
          {React.cloneElement(item.icon, { size: 16 })}
        </span>
        {!collapsed && <span className="font-medium truncate">{item.title}</span>}
      </Link>
    );
  }

  if (collapsed) {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={toggleCompactMenu}
          title={item.title}
          className={`w-full flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
            compactOpen || hasActiveChild ? 'text-[#2F2923] bg-[#F1EADF]/60' : 'text-[#6E655B] hover:bg-[#F1EADF]/40'
          }`}
        >
          <span className={`${compactOpen || hasActiveChild ? 'text-[#C6A243]' : 'text-[#93887C]'}`}>
            {React.cloneElement(item.icon, { size: 16 })}
          </span>
        </button>

        {compactOpen && (
          <div
            data-compact-menu={compactMenuId}
            className="fixed z-[9999] bg-[#FCFAF5] border border-[#D7CCBC] shadow-2xl rounded-xl p-2 flex flex-col gap-1.5"
            style={{ top: compactPosition.top, left: compactPosition.left }}
          >
            {item.children.map((child, idx) => (
              <Link
                key={idx}
                to={child.path}
                onClick={onNavigate}
                title={child.title}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  currentPath === child.path ? 'bg-[#2F2923] text-[#C6A243]' : 'text-[#93887C] hover:bg-[#F1EADF] hover:text-[#2F2923]'
                }`}
              >
                {React.cloneElement(child.icon || <Activity />, { size: 15 })}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-all group ${
          isOpen || hasActiveChild ? 'text-[#2F2923] bg-[#F1EADF]/60' : 'text-[#6E655B] hover:bg-[#F1EADF]/40 hover:text-[#2F2923]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${isOpen || hasActiveChild ? 'text-[#C6A243]' : 'text-[#93887C] group-hover:text-[#C6A243]'}`}>
            {React.cloneElement(item.icon, { size: 16 })}
          </span>
          <span className={`font-semibold uppercase tracking-wider text-[10px] truncate ${hasActiveChild ? 'text-[#2F2923]' : ''}`}>
            {item.title}
          </span>
        </div>
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#C6A243]' : 'text-[#93887C]'}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="ml-4 pl-3 border-l border-[#D7CCBC]/60 space-y-0.5 pb-2">
          {item.children.map((child, idx) => (
            <Link
              key={idx}
              to={child.path}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[11px] transition-all group ${
                currentPath === child.path ? 'text-[#C6A243] font-bold' : 'text-[#93887C] hover:text-[#2F2923]'
              }`}
            >
              <span className="text-current">{React.cloneElement(child.icon || <Activity />, { size: 13 })}</span>
              <span className="truncate">{child.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));

  useEffect(() => {
    const syncUser = () => setUser(JSON.parse(localStorage.getItem('user')));

    window.addEventListener('storage', syncUser);
    window.addEventListener('krm-user-updated', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('krm-user-updated', syncUser);
    };
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setMenuMovilAbierto(false);
      if (!desktop) setMenuCompacto(false);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [location.pathname]);

  const isAdmin = user?.rol_id === 1;
  const userPermisos = user?.permisos || [];
  const userImageUrl = user?.imagen_url ? `http://localhost:3000${user.imagen_url}` : null;
  const canAccessSecurityModule =
    isAdmin ||
    userPermisos.includes('Gestionar usuarios') ||
    userPermisos.includes('Gestionar roles') ||
    userPermisos.includes('Gestionar permisos');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigationRaw = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard />, public: true },
    {
      title: 'Mantenimientos',
      icon: <Users />,
      children: [
        { title: 'Clientes', path: '/clientes', permiso: 'Registrar clientes', icon: <UserCheck /> },
        { title: 'Vehículos', path: '/vehiculos', permiso: 'Registrar vehiculos', icon: <Car /> },
        { title: 'Gamas', path: '/gamas', permiso: 'Registrar vehiculos', icon: <Tag /> },
        { title: 'Feriados', path: '/feriados', permiso: 'Configurar precios', icon: <CalendarDays /> }
      ]
    },
    {
      title: 'Procesos',
      icon: <ClipboardList />,
      children: [
        { title: 'Alquileres', path: '/alquileres', permiso: 'Registrar alquileres', icon: <ClipboardList /> },
        { title: 'Devoluciones', path: '/devoluciones', permiso: 'Procesar devoluciones', icon: <RotateCcw /> },
        { title: 'Pagos', path: '/pagos', permiso: 'Registrar pagos', icon: <CreditCard /> }
      ]
    },
    {
      title: 'Consultas',
      icon: <Search />,
      children: [
        { title: 'Disponibilidad', path: '/disponibilidad', permiso: 'Registrar alquileres', icon: <Activity /> },
        { title: 'Alquileres Activos', path: '/alquileres-activos', permiso: 'Registrar alquileres', icon: <Car /> },
        { title: 'Historial', path: '/historial-clientes', permiso: 'Registrar clientes', icon: <History /> },
        { title: 'Estados de Cuenta', path: '/estados-cuenta', permiso: 'Registrar pagos', icon: <FileText /> }
      ]
    },
    { title: 'Seguridad Staff', path: '/seguridad', icon: <ShieldCheck />, visible: canAccessSecurityModule },
    {
      title: 'Reportes',
      icon: <BarChart3 />,
      children: [
        { title: 'Ingresos', path: '/reporte-ingresos', permiso: 'Consultar reportes', icon: <BarChart3 /> },
        { title: 'Más Rentados', path: '/reporte-rentados', permiso: 'Consultar reportes', icon: <Trophy /> },
        { title: 'Clientes Frecuentes', path: '/reporte-frecuentes', permiso: 'Consultar reportes', icon: <UserCheck /> },
        { title: 'Penalidades', path: '/reporte-penalidades', permiso: 'Consultar reportes', icon: <AlertTriangle /> },
        { title: 'Analítica Feriados', path: '/reporte-feriados', permiso: 'Consultar reportes', icon: <PieChart /> }
      ]
    }
  ];

  const filteredNavigation = navigationRaw
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter((child) => isAdmin || userPermisos.includes(child.permiso));
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
      }

      if (item.visible !== undefined) return item.visible ? item : null;
      if (item.public || isAdmin || userPermisos.includes(item.permiso)) return item;
      return null;
    })
    .filter(Boolean);

  const colapsado = isDesktop && menuCompacto;

  return (
    <div className="flex h-screen w-full bg-[#F4EFE6] font-inter overflow-hidden">
      {!isDesktop && menuMovilAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuMovilAbierto(false)}
          className="fixed inset-0 bg-black/35 z-[60]"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[70] bg-[#E8E0D3] flex flex-col border-r border-[#D7CCBC] transition-all duration-300 ${
          menuMovilAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-[250px] ${colapsado ? 'lg:w-[76px]' : 'lg:w-[230px]'}`}
      >
        <div className={`p-4 border-b border-[#D7CCBC] flex ${colapsado ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
          <h1 className={`font-black text-[#C6A243] uppercase font-sora italic leading-none ${colapsado ? 'text-[18px]' : 'text-xl text-center'}`}>
            KRM
            {!colapsado && (
              <span className="text-[#6E655B] font-light text-[9px] block tracking-[0.3em] not-italic mt-1">Rent-Car</span>
            )}
          </h1>

          <button
            onClick={() => (isDesktop ? setMenuCompacto((v) => !v) : setMenuMovilAbierto(false))}
            className="w-8 h-8 rounded-lg border border-[#D7CCBC] bg-[#FCFAF5] text-[#6E655B] hover:text-[#C6A243] hover:border-[#C6A243]/60 transition-all flex items-center justify-center"
            title={isDesktop ? (colapsado ? 'Expandir menú' : 'Colapsar menú') : 'Cerrar menú'}
          >
            {isDesktop ? colapsado ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} /> : <X size={15} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {filteredNavigation.map((item, idx) => (
            <MenuSection
              key={idx}
              item={item}
              currentPath={location.pathname}
              collapsed={colapsado}
              onNavigate={() => setMenuMovilAbierto(false)}
            />
          ))}
        </nav>

        <div className={`p-4 border-t border-[#D7CCBC] ${colapsado ? 'space-y-2' : ''}`}>
          <div className={`flex items-center ${colapsado ? 'justify-center' : 'gap-2.5 mb-3 px-1'} text-left`}>
            <div className="w-10 h-10 rounded-full bg-[#C6A243] flex items-center justify-center text-white font-black text-xs overflow-hidden border border-[#D7CCBC]/60 shadow-sm">
              {userImageUrl ? (
                <img src={userImageUrl} alt={user?.nombre || 'Usuario KRM'} className="h-full w-full object-cover" />
              ) : (
                user?.nombre?.charAt(0) || 'U'
              )}
            </div>
            {!colapsado && (
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-[#2F2923] truncate leading-tight">{[user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Usuario KRM'}</p>
                <p className="text-[9px] text-[#93887C] uppercase font-medium">{isAdmin ? 'Admin KRM' : 'Staff Operativo'}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Salir"
            className={`w-full flex items-center ${colapsado ? 'justify-center' : 'gap-2 px-3'} py-2 text-[10px] text-[#C97B6A] hover:bg-[#C97B6A]/5 rounded-lg transition-all font-black uppercase tracking-widest border border-transparent hover:border-[#C97B6A]/20`}
          >
            <LogOut size={12} /> {!colapsado && 'Salir'}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="h-14 bg-[#FCFAF5] border-b border-[#D7CCBC] flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            {!isDesktop && (
              <button
                onClick={() => setMenuMovilAbierto(true)}
                className="w-8 h-8 rounded-lg border border-[#D7CCBC] bg-white text-[#6E655B] hover:text-[#C6A243] transition-all flex items-center justify-center"
                title="Abrir menú"
              >
                <Menu size={16} />
              </button>
            )}
            <h2 className="text-[9px] sm:text-[10px] font-black text-[#93887C] uppercase tracking-[0.25em] sm:tracking-[0.3em] truncate">Panel Operativo</h2>
          </div>
          <div className="text-[8px] sm:text-[9px] text-[#93887C] font-mono italic opacity-40 uppercase">KRM System - 2026</div>
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-5 lg:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
