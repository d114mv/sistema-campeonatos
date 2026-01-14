import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom'; // Importamos useLocation y Link
import client from '../api/client';
import { Medal, ShieldAlert, Award, Shield, ArrowLeft } from 'lucide-react';

const EstadisticasPage = () => {
  const [stats, setStats] = useState<{ 
    goleadores: any[], 
    tarjetas: any[], 
    vallaMenosVencida: any[] 
  }>({ goleadores: [], tarjetas: [], vallaMenosVencida: [] });

  const [activeTab, setActiveTab] = useState<'goles' | 'tarjetas' | 'valla'>('goles');
  const [loading, setLoading] = useState(true);
  
  // Usamos location para saber si estamos en el dashboard o en modo público
  const location = useLocation();
  const isPublic = !location.pathname.includes('/dashboard');

  useEffect(() => {
    client.get('/public/estadisticas')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Calculando estadísticas...</div>;

  return (
    <div className="space-y-6">
      
      {/* CABECERA CON BOTÓN VOLVER (Solo si es público) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="text-purple-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Centro de Estadísticas</h1>
            <p className="text-slate-500">Rendimiento individual de jugadores</p>
          </div>
        </div>
        {isPublic && (
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition">
             <ArrowLeft size={20} /> Volver al Inicio
          </Link>
        )}
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('goles')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'goles' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Medal size={18} /> Goleadores
        </button>
        
        <button
          onClick={() => setActiveTab('valla')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'valla' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Shield size={18} /> Valla Menos Vencida
        </button>

        <button
          onClick={() => setActiveTab('tarjetas')}
          className={`pb-3 px-4 font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'tarjetas' 
              ? 'text-red-600 border-b-2 border-red-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShieldAlert size={18} /> Sanciones
        </button>
      </div>

      {/* 1. CONTENIDO GOLEADORES */}
      {activeTab === 'goles' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-4 text-center w-16">Rank</th>
                <th className="p-4">Jugador</th>
                <th className="p-4 text-center">Goles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.goleadores.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-400">Aún no hay goles registrados.</td></tr>
              ) : (
                stats.goleadores.map((player: any, index: number) => (
                  <tr key={player.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center">
                      <span className={`font-black text-lg ${index === 0 ? 'text-yellow-500 text-2xl' : 'text-slate-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                           {player.escudoUrl ? <img src={player.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{player.nombre}</p>
                          <p className="text-xs text-slate-500">{player.equipo} • #{player.dorsal}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black">
                        {player.goles}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CONTENIDO VALLA MENOS VENCIDA */}
      {activeTab === 'valla' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-4 text-center w-16">Rank</th>
                <th className="p-4">Arquero</th>
                <th className="p-4 text-center text-green-700">Goles Recibidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.vallaMenosVencida.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-400">No hay arqueros registrados o partidos jugados.</td></tr>
              ) : (
                stats.vallaMenosVencida.map((player: any, index: number) => (
                  <tr key={player.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center">
                      <span className={`font-black text-lg ${index === 0 ? 'text-yellow-500 text-2xl' : 'text-slate-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                           {player.escudoUrl ? <img src={player.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{player.nombre}</p>
                          <p className="text-xs text-slate-500">{player.equipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-black">
                        {player.golesRecibidos}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CONTENIDO TARJETAS */}
      {activeTab === 'tarjetas' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-4">Jugador</th>
                <th className="p-4 text-center text-yellow-600">Amarillas</th>
                <th className="p-4 text-center text-red-600">Rojas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.tarjetas.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-400">¡Juego limpio! No hay tarjetas.</td></tr>
              ) : (
                stats.tarjetas.map((player: any) => (
                  <tr key={player.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-800">{player.nombre}</p>
                        <p className="text-xs text-slate-500">{player.equipo}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-yellow-600 bg-yellow-50">{player.amarillas}</td>
                    <td className="p-4 text-center font-bold text-red-600 bg-red-50">{player.rojas}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EstadisticasPage;