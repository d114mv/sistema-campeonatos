import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Trophy, Calendar, ArrowRight, BarChart3 } from 'lucide-react';
// Importamos el reloj pequeño
import MatchTimer from '../components/MatchTimer';

const LandingPage = () => {
  const [tabla, setTabla] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const resTabla = await client.get('/public/posiciones');
        const resPartidos = await client.get('/public/partidos');
        
        setTabla(resTabla.data.slice(0, 5)); 

        // --- LÓGICA DE ORDENAMIENTO INTELIGENTE ---
        // Queremos ver primero los que se están jugando AHORA
        const partidosOrdenados = resPartidos.data.sort((a: any, b: any) => {
          // Asignamos un "peso" a cada estado (Menor número = Más arriba)
          const getPeso = (estado: string) => {
            if (estado === 'EN_VIVO') return 1;
            if (estado === 'ENTRETIEMPO') return 1; // Mismo peso que en vivo
            if (estado === 'PROGRAMADO') return 2;
            if (estado === 'FINALIZADO') return 3;
            return 4; // Cancelados u otros
          };

          const pesoA = getPeso(a.estado);
          const pesoB = getPeso(b.estado);

          // Si tienen diferente prioridad, gana el de menor peso (En Vivo)
          if (pesoA !== pesoB) return pesoA - pesoB;

          // Si tienen el mismo estado (ej: dos programados), ordenar por fecha
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        });

        // Ahora sí, tomamos los primeros 4 (que serán los En Vivo o Próximos)
        setPartidos(partidosOrdenados.slice(0, 4)); 

      } catch (error) {
        console.error("Error cargando datos públicos");
      }
    };

    loadData();
    
    // Refresco automático cada 15 seg
    const interval = setInterval(loadData, 15000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* NAVBAR */}
      <nav className="bg-[#002b5c] text-white p-4 sticky top-0 z-50 shadow-lg border-b border-yellow-500"> {/* Azul EMI + Borde Dorado */}
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 font-bold text-xl">
          {/* CAMBIO: Usamos la imagen en vez del icono Trophy */}
          <img src="/logo_emi.png" alt="Escudo EMI" className="h-10 w-auto" />
        <span className="tracking-wide">DEPORTES EMI</span>
    </div>
          <Link to="/login" className="text-sm bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition font-bold">
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="bg-gradient-to-b from-[#002b5c] to-[#001f42] text-white py-20 px-4 text-center relative overflow-hidden">
  {/* Opcional: Círculo decorativo amarillo de fondo */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
  
  <div className="relative z-10">
    <h1 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tight">
      Torneo Intercarreras <span className="text-yellow-400">2026</span>
    </h1>
    <p className="text-blue-100 text-lg max-w-2xl mx-auto font-medium">
      Disciplina, Honor y Pasión en cada jugada.
    </p>
  </div>
</header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 mb-12 relative z-10">
        
        {/* COLUMNA IZQUIERDA: PARTIDOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-lg border-t-4 border-blue-500 p-6">
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Calendar className="text-blue-600" size={24}/> Marcadores en Vivo
             </h2>
             
             <div className="space-y-4">
               {partidos.map(p => (
                 <div 
                    key={p.id} 
                    onClick={() => navigate(`/partido/${p.id}`)}
                    className={`group bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer relative overflow-hidden ${
                      p.estado === 'EN_VIVO' || p.estado === 'ENTRETIEMPO' ? 'border-blue-500 shadow-blue-100 ring-1 ring-blue-100' : 'border-slate-200'
                    }`}
                 >
                    {/* Barra superior de estado */}
                    <div className={`absolute top-0 right-0 left-0 h-1 transition-colors ${
                       p.estado === 'EN_VIVO' ? 'bg-red-500 animate-pulse' : 'bg-slate-100 group-hover:bg-blue-500'
                    }`} />

                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-bold text-slate-400">{new Date(p.fecha).toLocaleDateString()} • {p.jornada.nombre}</span>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          p.estado === 'EN_VIVO' ? 'bg-red-100 text-red-600 animate-pulse' : 
                          p.estado === 'ENTRETIEMPO' ? 'bg-orange-100 text-orange-600' :
                          p.estado === 'FINALIZADO' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'
                       }`}>
                          {p.estado === 'EN_VIVO' ? '● EN JUEGO' : p.estado}
                       </span>
                    </div>

                    <div className="flex items-center justify-between">
                       {/* LOCAL */}
                       <div className="flex items-center gap-3 w-1/3">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 overflow-hidden">
                             {p.equipoLocal.escudoUrl ? <img src={p.equipoLocal.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                          </div>
                          <span className="font-bold text-slate-700 text-sm leading-tight">{p.equipoLocal.nombre}</span>
                       </div>

                       {/* SCORE CENTRAL */}
                       <div className="flex flex-col items-center justify-center w-1/3">
                          {p.estado === 'PROGRAMADO' ? (
                             <span className="text-2xl font-bold text-slate-300">VS</span>
                          ) : (
                             <div className="flex gap-3 text-3xl font-black text-slate-800">
                                <span>{p.golesLocal}</span>
                                <span className="text-slate-300">-</span>
                                <span>{p.golesVisitante}</span>
                             </div>
                          )}
                          
                          {/* SI ESTÁ EN VIVO O ENTRETIEMPO, MOSTRAMOS EL RELOJ */}
                          {(p.estado === 'EN_VIVO' || p.estado === 'ENTRETIEMPO') && (
                             <div className="scale-75 mt-1 text-slate-500">
                                <MatchTimer inicioTiempo={p.inicioTiempo} tiempoJuego={p.tiempoJuego} estado={p.estado} />
                             </div>
                          )}
                       </div>

                       {/* VISITANTE */}
                       <div className="flex items-center gap-3 w-1/3 justify-end text-right">
                          <span className="font-bold text-slate-700 text-sm leading-tight">{p.equipoVisitante.nombre}</span>
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 overflow-hidden">
                             {p.equipoVisitante.escudoUrl ? <img src={p.equipoVisitante.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                          </div>
                       </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                       <span className="text-xs font-bold text-blue-600 group-hover:underline">Ver detalles del partido &rarr;</span>
                    </div>
                 </div>
               ))}
               {partidos.length === 0 && <p className="text-slate-400 text-center py-8">No hay partidos activos.</p>}
             </div>
          </div>
        </div>
        
        {/* COLUMNA DERECHA: TABLA Y ACCESOS */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-lg border-t-4 border-yellow-500 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-600" size={20}/> Tabla Top 5
              </h2>
              <table className="w-full text-sm mb-4">
                <tbody className="divide-y">
                  {tabla.map((t, i) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 flex items-center gap-3">
                        <span className={`font-bold w-6 text-center ${i===0 ? 'text-yellow-600': 'text-slate-400'}`}>{i+1}</span>
                        <span className="font-bold text-slate-700">{t.nombre}</span>
                      </td>
                      <td className="text-center font-black text-blue-700">{t.pts} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link to="/posiciones" className="block w-full text-center bg-slate-100 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-200 transition text-sm">
                 Ver Tabla Completa
              </Link>
           </div>

           <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
              <BarChart3 className="mb-2 opacity-80" size={32} />
              <h3 className="font-bold text-lg mb-1">Centro de Estadísticas</h3>
              <p className="text-purple-200 text-xs mb-4">Goleadores, Tarjetas y Valla menos vencida.</p>
              <Link to="/estadisticas" className="inline-flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition">
                 Ver Rankings <ArrowRight size={14} />
              </Link>
           </div>
        </div>

      </main>

      <footer className="text-center py-8 text-slate-400 text-sm border-t border-slate-200">
        &copy; 2026 Sistema de Campeonatos EMI - UEyBU
      </footer>
    </div>
  );
};

export default LandingPage;