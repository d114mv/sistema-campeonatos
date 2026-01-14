import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Clock,  Goal, AlertTriangle, Square } from 'lucide-react';
import MatchTimer from '../components/MatchTimer';

const PublicMatchPage = () => {
  const { id } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = async () => {
    try {
      const { data } = await client.get(`/public/partidos/${id}`);
      setMatch(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-8 text-center animate-pulse">Cargando partido...</div>;
  if (!match) return <div className="p-8 text-center">Partido no encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      
      {/* HEADER: MARCADOR Y TIEMPO */}
{/* Cambiamos bg-slate-900 por el Azul EMI */}
<div className="bg-[#002b5c] text-white pb-10 pt-6 px-4 rounded-b-[2rem] shadow-xl relative overflow-hidden border-b-4 border-yellow-500">
  
  {/* Fondo decorativo opcional */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

  <div className="max-w-md mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition">
            <ArrowLeft size={20} className="mr-1"/> Volver
          </Link>
          
          {/* Estado y Reloj */}
          <div className="flex flex-col items-center mb-6">
            {match.estado === 'EN_VIVO' && (
              <div className="mb-2">
                 <MatchTimer 
                    inicioTiempo={match.inicioTiempo} 
                    tiempoJuego={match.tiempoJuego} 
                    estado={match.estado} 
                 />
              </div>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest ${
              match.estado === 'EN_VIVO' ? 'bg-red-600 animate-pulse' : 
              match.estado === 'FINALIZADO' ? 'bg-slate-700' : 'bg-blue-600'
            }`}>
              {match.estado === 'EN_VIVO' ? (match.periodo === 2 ? '2DO TIEMPO' : '1ER TIEMPO') : match.estado.replace('_', ' ')}
            </span>
          </div>

          {/* Equipos y Resultado */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center w-1/3">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2 overflow-hidden backdrop-blur-sm border border-white/20">
                {match.equipoLocal.escudoUrl ? <img src={match.equipoLocal.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
              </div>
              <h2 className="text-sm font-bold text-center leading-tight">{match.equipoLocal.nombre}</h2>
            </div>

            <div className="flex gap-4 items-center">
               <span className="text-5xl font-black">{match.golesLocal}</span>
               <span className="text-slate-500 text-2xl font-light">-</span>
               <span className="text-5xl font-black">{match.golesVisitante}</span>
            </div>

            <div className="flex flex-col items-center w-1/3">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2 overflow-hidden backdrop-blur-sm border border-white/20">
                 {match.equipoVisitante.escudoUrl ? <img src={match.equipoVisitante.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
              </div>
              <h2 className="text-sm font-bold text-center leading-tight">{match.equipoVisitante.nombre}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE DE EVENTOS (Minuto a Minuto) */}
      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 text-center">
            Incidencias del Partido
          </div>
          
          <div className="divide-y divide-slate-100">
            {match.eventos && match.eventos.length > 0 ? (
              match.eventos.map((evento: any) => {
                const isLocal = match.equipoLocal.jugadores.some((p: any) => p.id === evento.jugadorId);
                
                let Icon = Goal;
                let color = "text-slate-500";
                let text = "";
                
                if (evento.tipo === 'GOL') { Icon = Goal; color = "text-green-600"; text = "GOL"; }
                if (evento.tipo === 'TARJETA_AMARILLA') { Icon = AlertTriangle; color = "text-yellow-500"; text = "Tarjeta Amarilla"; }
                if (evento.tipo === 'TARJETA_ROJA') { Icon = Square; color = "text-red-600"; text = "Tarjeta Roja"; }

                return (
                  <div key={evento.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                     {/* LADO LOCAL */}
                     <div className={`flex-1 flex items-center gap-2 ${isLocal ? 'justify-start' : 'invisible'}`}>
                        <div className={`p-2 rounded-full bg-slate-100 ${color}`}><Icon size={16} fill="currentColor"/></div>
                        <div>
                           <p className="font-bold text-sm text-slate-800">{evento.jugador?.nombre}</p>
                           <p className="text-xs text-slate-500 font-medium">{text}</p>
                        </div>
                     </div>

                     {/* MINUTO CENTRAL (AQUÍ ESTÁ LA CORRECCIÓN VISUAL) */}
                     <div className="w-10 flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-slate-300">MIN</span>
                        {/* Mostramos directamente el minuto guardado en la DB */}
                        <span className="font-bold text-slate-700 text-lg">{evento.minuto > 0 ? evento.minuto + "'" : "-"}</span>
                     </div>

                     {/* LADO VISITANTE */}
                     <div className={`flex-1 flex items-center gap-2 flex-row-reverse text-right ${!isLocal ? 'justify-start' : 'invisible'}`}>
                        <div className={`p-2 rounded-full bg-slate-100 ${color}`}><Icon size={16} fill="currentColor"/></div>
                        <div>
                           <p className="font-bold text-sm text-slate-800">{evento.jugador?.nombre}</p>
                           <p className="text-xs text-slate-500 font-medium">{text}</p>
                        </div>
                     </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Clock className="mx-auto mb-2 opacity-50" />
                Aún no hay incidencias registradas.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PublicMatchPage;