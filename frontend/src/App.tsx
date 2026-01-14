import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardHome from './pages/DashboardHome';
import EquiposPage from './pages/EquiposPage';
import PartidosPage from './pages/PartidosPage';
import ControlPartidoPage from './pages/ControlPartidoPage';
import PosicionesPage from './pages/PosicionesPage';
import LandingPage from './pages/LandingPage';
import PlantillaPage from './pages/PlantillaPage';
import EstadisticasPage from './pages/EstadisticasPage';
import PublicMatchPage from './pages/PublicMatchPage';
import UsuariosPage from './pages/UsuariosPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      {/* 2. AGREGAR EL COMPONENTE TOASTER CON ESTILO EMI */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000, // Se cierran solos a los 3 segundos
          style: {
            background: '#002b5c', // Azul EMI
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '10px',
            border: '1px solid #eaaa00', // Borde Dorado
          },
          success: {
            iconTheme: {
              primary: '#eaaa00', // Icono Dorado
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#b91c1c', // Rojo oscuro para errores
              border: '1px solid #fff',
            },
          },
        }}
      />

      <Routes>
        {/* ... (TUS RUTAS SIGUEN IGUAL) ... */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/partido/:id" element={<PublicMatchPage />} />
        
        <Route path="/estadisticas" element={
          <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              <EstadisticasPage />
            </div>
          </div>
        } />

        <Route path="/posiciones" element={
          <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              <PosicionesPage />
            </div>
          </div>
        } />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="partidos" element={<PartidosPage />} />
            <Route path="partido/:id" element={<ControlPartidoPage />} />
            <Route path="posiciones" element={<PosicionesPage />} />
            <Route path="estadisticas" element={<EstadisticasPage />} />
            <Route path="equipos/:id/jugadores" element={<PlantillaPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;