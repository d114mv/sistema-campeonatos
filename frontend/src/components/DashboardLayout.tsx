import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Shield, 
  CalendarDays, 
  Trophy, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  UserCog 
} from 'lucide-react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Clases para los items del menú (Actualizado con colores institucionales al hacer hover)
  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
    ${isActive(path) 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
      : 'text-blue-100 hover:bg-[#001f42] hover:text-white'}
  `;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      
      {/* SIDEBAR (Menú Lateral) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#002b5c] text-white transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo del Sidebar */}
          <div className="p-6 border-b border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
               {/* Asegúrate de que logo_emi.png esté en la carpeta public */}
               <img src="/logo_emi.png" alt="EMI" className="h-10 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
               {/* Si falla la imagen, mostramos texto */}
               <span className="lg:hidden xl:block">FUTSAL EMI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-blue-200 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>

            <Link to="/dashboard/equipos" className={linkClass('/dashboard/equipos')}>
              <Shield size={20} /> Equipos
            </Link>

            <Link to="/dashboard/partidos" className={linkClass('/dashboard/partidos')}>
              <CalendarDays size={20} /> Partidos
            </Link>

            <Link to="/dashboard/posiciones" className={linkClass('/dashboard/posiciones')}>
              <Trophy size={20} /> Posiciones
            </Link>
            
            <Link to="/dashboard/estadisticas" className={linkClass('/dashboard/estadisticas')}>
              <BarChart3 size={20} /> Estadísticas
            </Link>

            {/* --- SECCIÓN SOLO PARA ADMIN --- */}
            {user?.rol === 'ADMIN' && (
              <>
                <div className="my-4 border-t border-blue-800 pt-4 pb-1 px-4 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Administración
                </div>
                
                <Link to="/dashboard/usuarios" className={linkClass('/dashboard/usuarios')}>
                  <UserCog size={20} /> Usuarios y Accesos
                </Link>
              </>
            )}

          </nav>

          {/* Usuario y Logout */}
          <div className="p-4 border-t border-blue-800 bg-[#00224a]">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${user?.rol === 'ADMIN' ? 'bg-yellow-500 text-blue-900' : 'bg-blue-600 text-white'}
              `}>
                {user?.nombre?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{user?.nombre}</p>
                <p className="text-xs text-blue-300 font-medium">{user?.rol === 'ADMIN' ? 'Administrador' : 'Oficial de Mesa'}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-[#001a38] hover:bg-red-600 text-blue-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold border border-blue-900/50"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Móvil */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 lg:hidden sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="text-[#002b5c]">
            <Menu size={24} />
          </button>
          <span className="font-bold text-[#002b5c] text-lg">Menú Principal</span>
        </header>

        {/* Área de trabajo */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto animate-fade-in">
             <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;