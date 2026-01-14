import { useEffect, useState } from 'react';
import client from '../api/client';
import { Trophy, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PosicionesPage = () => {
  const [tabla, setTabla] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detectar si estamos en modo público o admin
  const location = useLocation();
  const isPublic = !location.pathname.includes('/dashboard');

  useEffect(() => {
    // Usamos la ruta PÚBLICA (/public/posiciones) para que funcione siempre
    client.get('/public/posiciones')
      .then(res => setTabla(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando tabla...</div>;

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
            <Trophy size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tabla de Posiciones</h1>
            <p className="text-slate-500">Clasificación General</p>
          </div>
        </div>

        {/* Botón Volver (Solo visible para fans) */}
        {isPublic && (
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition">
             <ArrowLeft size={20} /> Volver al Inicio
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <th className="p-4 w-16 text-center">Pos</th>
                <th className="p-4">Equipo</th>
                <th className="p-4 text-center" title="Partidos Jugados">PJ</th>
                <th className="p-4 text-center hidden md:table-cell" title="Ganados">G</th>
                <th className="p-4 text-center hidden md:table-cell" title="Empatados">E</th>
                <th className="p-4 text-center hidden md:table-cell" title="Perdidos">P</th>
                <th className="p-4 text-center hidden md:table-cell" title="Goles a Favor">GF</th>
                <th className="p-4 text-center hidden md:table-cell" title="Goles en Contra">GC</th>
                <th className="p-4 text-center" title="Diferencia de Gol">DG</th>
                <th className="p-4 text-center bg-blue-50 text-blue-700 w-24">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tabla.map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-center">
                    <span className={`font-black ${
                      index === 0 ? 'text-yellow-500 text-xl' : 
                      index < 3 ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                         {t.escudoUrl ? <img src={t.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                      </div>
                      <span className="font-bold text-slate-700">{t.nombre}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium text-slate-600">{t.pj}</td>
                  <td className="p-4 text-center hidden md:table-cell text-slate-400">{t.pg}</td>
                  <td className="p-4 text-center hidden md:table-cell text-slate-400">{t.pe}</td>
                  <td className="p-4 text-center hidden md:table-cell text-slate-400">{t.pp}</td>
                  <td className="p-4 text-center hidden md:table-cell text-green-600">{t.gf}</td>
                  <td className="p-4 text-center hidden md:table-cell text-red-400">{t.gc}</td>
                  <td className="p-4 text-center font-bold text-slate-600">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                  <td className="p-4 text-center bg-blue-50 font-black text-blue-700 text-lg border-l border-blue-100">
                    {t.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PosicionesPage;