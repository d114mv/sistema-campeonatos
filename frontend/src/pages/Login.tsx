import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importamos Link
import client from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react'; // Importamos el icono

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await client.post('/auth/login', { email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(`¡Bienvenido ${data.user.nombre}!`, {
        icon: '🫡',
        duration: 2000
      });

      navigate('/dashboard');
    } catch (error) {
      toast.error('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md relative">
        
        {/* --- BOTÓN VOLVER AL INICIO --- */}
        <Link 
          to="/" 
          className="absolute top-4 left-4 text-slate-400 hover:text-[#002b5c] transition p-2 rounded-full hover:bg-slate-50"
          title="Volver al Inicio"
        >
           <ArrowLeft size={24} />
        </Link>

        <div className="text-center mb-6 mt-4">
           {/* Opcional: Si tienes el logo, podrías ponerlo aquí pequeño */}
           {/* <img src="/logo_emi.png" className="h-12 mx-auto mb-2" /> */}
           <h2 className="text-2xl font-bold text-slate-800">
             Sistema de Campeonatos
           </h2>
           <p className="text-sm text-slate-500">Ingreso exclusivo para personal autorizado</p>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] focus:border-transparent transition"
              placeholder="tucorreo@emi.edu.bo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] focus:border-transparent transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#002b5c] hover:bg-[#001f42] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002b5c] transition-colors border-b-4 border-yellow-500"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;