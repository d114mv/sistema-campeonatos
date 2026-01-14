import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Trophy, 
  LogOut ,
  Award
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Obtener usuario del localStorage para verificar el ROL
  const userStr = localStorage.getItem('user');
  // Si no hay usuario, asumimos rol INVITADO para evitar errores
  const user = userStr ? JSON.parse(userStr) : { rol: 'INVITADO' };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); 
  };

  // 2. Definir todos los menús posibles
  const allMenuItems = [
    { 
      path: '/dashboard', 
      icon: <LayoutDashboard size={20} />, 
      label: 'Inicio',
      roles: ['ADMIN', 'OFICIAL'] 
    },
    { 
      path: '/dashboard/equipos', 
      icon: <Users size={20} />, 
      label: 'Equipos',
      roles: ['ADMIN'] // El Oficial NO verá esto
    },
    { 
      path: '/dashboard/partidos', 
      icon: <Calendar size={20} />, 
      label: 'Partidos',
      roles: ['ADMIN', 'OFICIAL'] 
    },
    { 
      path: '/dashboard/posiciones', 
      icon: <Trophy size={20} />, 
      label: 'Posiciones',
      roles: ['ADMIN', 'OFICIAL'] 
    },
    { 
      path: '/dashboard/estadisticas', 
      icon: <Award size={20} />, 
      label: 'Estadísticas',
      roles: ['ADMIN', 'OFICIAL'] 
    },
  ];

  // 3. Filtrar el menú según el rol del usuario
  // Si user.rol no existe, filtramos para que no rompa la app
  const currentRole = user.rol || 'INVITADO';
  const allowedMenuItems = allMenuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Cabecera */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400">FUTSAL EMI ⚽</h1>
        <p className="text-xs text-slate-400 mt-1">Panel Administrativo</p>
      </div>

      {/* Navegación Dinámica */}
      <nav className="flex-1 p-4 space-y-2">
        {allowedMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Botón Salir */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;