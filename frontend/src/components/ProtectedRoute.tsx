import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Verificamos si existe el token
  const token = localStorage.getItem('token');

  // Si no hay token, lo mandamos al Login ("/")
  // Si hay token, mostramos el contenido (<Outlet />)
  return token ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;