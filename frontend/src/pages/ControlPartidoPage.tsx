import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { 
  Play, Square, Goal, AlertTriangle, ArrowLeft, Ban, Pause, Gavel, RotateCw, 
  CheckCircle, DollarSign, Circle, Upload, Image as ImageIcon, Lock, X 
} from 'lucide-react';
import MatchTimer from '../components/MatchTimer';
import toast from 'react-hot-toast';

const ControlPartidoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // --- NUEVO ESTADO PARA EL MENÚ DE WALKOVER ---
  const [showWalkoverMenu, setShowWalkoverMenu] = useState(false);

  // --- TUS CREDENCIALES CLOUDINARY ---
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

  const fetchMatch = async () => {
    try {
      const { data } = await client.get(`/admin/partidos/${id}`);
      setMatch(data);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando partido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatch(); }, [id]);

  const getCurrentMinute = () => {
    if (!match) return 0;
    let segundosTotales = match.tiempoJuego;
    if (match.inicioTiempo && match.estado === 'EN_VIVO') {
      const ahora = new Date().getTime();
      const inicio = new Date(match.inicioTiempo).getTime();
      const diffSegundos = Math.floor((ahora - inicio) / 1000);
      segundosTotales += diffSegundos;
    }
    return Math.floor(segundosTotales / 60) + 1;
  };

  const handleEvent = async (tipo: string, jugadorId: number, equipoId: number) => {
    const mensaje = tipo === 'TARJETA_ROJA' ? '¿Expulsar con ROJA DIRECTA?' : `¿Confirmar ${tipo}?`;
    if (!confirm(mensaje)) return;
    try {
      await client.post('/admin/eventos', { partidoId: id, tipo, jugadorId, equipoId, minuto: getCurrentMinute() });
      fetchMatch();
      toast.success('Incidencia registrada');
    } catch (error) { toast.error('Error registrando evento'); }
  };

  // --- FUNCIÓN PARA WALKOVER ---
  const handleWalkover = async (ganador: 'LOCAL' | 'VISITANTE') => {
    const equipo = ganador === 'LOCAL' ? match.equipoLocal.nombre : match.equipoVisitante.nombre;
    const perdedor = ganador === 'LOCAL' ? match.equipoVisitante.nombre : match.equipoLocal.nombre;
    
    if (!confirm(`⚠️ ¿Declarar WALKOVER a favor de ${equipo}?\n\n- ${perdedor} perderá 0-3.\n- El partido finalizará inmediatamente.\n- Esta acción es irreversible.`)) return;

    try {
      await client.patch(`/admin/partidos/${id}/walkover`, { ganador });
      toast.success(`Walkover aplicado. Ganador: ${equipo} 🏆`);
      setShowWalkoverMenu(false); // Cerramos el menú
      fetchMatch();
    } catch (error) {
      toast.error('Error al aplicar Walkover');
    }
  };

  const changeStatus = async (estado: string) => {
    if (!confirm("¿Cambiar estado del partido?")) return;
    try {
      await client.patch(`/admin/partidos/${id}/estado`, { estado });
      fetchMatch();
      toast.success(`Estado cambiado a ${estado}`);
    } catch (error) { 
      toast.error('Error cambiando estado');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        const updateData = { ...match, planillaUrl: data.secure_url };
        await client.patch(`/admin/partidos/${id}/logistica`, { 
            ...updateData, 
            controlFinalizado: false 
        });
        setMatch(updateData);
        toast.success('Planilla subida correctamente 📷');
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const toggleLogistica = async (campo: string) => {
    if (match.controlFinalizado) return;
    try {
      const updateData = { ...match, [campo]: !match[campo] };
      await client.patch(`/admin/partidos/${id}/logistica`, updateData);
      setMatch(updateData);
      toast.success('Dato actualizado');
    } catch (error) { toast.error('Error al actualizar logística'); }
  };

  const finalizarControl = async () => {
    if (!match.planillaUrl) return toast.error("Debes subir la foto de la planilla antes de finalizar.");
    if (!confirm("¿Estás seguro? Una vez finalizado NO podrás editar los pagos ni la foto.")) return;

    try {
      await client.patch(`/admin/partidos/${id}/logistica`, { 
        ...match, 
        controlFinalizado: true 
      });
      fetchMatch();
      toast.success('Control finalizado correctamente 🔒');
    } catch (error) { toast.error('Error al finalizar control'); }
  };

  const getPlayerStatus = (playerId: number) => {
     if (!match) return { amarillas: 0, rojas: 0, expulsado: false, suspendidoPrevio: false };
     const suspendidoPrevio = match.idsSancionados?.includes(playerId);
     const evs = match.eventos ? match.eventos.filter((e: any) => e.jugadorId === playerId) : [];
     const amarillas = evs.filter((e: any) => e.tipo === 'TARJETA_AMARILLA').length;
     const rojas = evs.filter((e: any) => e.tipo === 'TARJETA_ROJA').length;
     const expulsado = suspendidoPrevio || rojas > 0 || amarillas >= 2;
     return { amarillas, rojas, expulsado, suspendidoPrevio };
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!match) return <div className="p-8 text-center">No encontrado</div>;

  return (
    <div className="space-y-6">
      
      {/* --- HEADER: MARCADOR --- */}
      <div className="bg-[#002b5c] text-white rounded-xl p-6 shadow-xl relative overflow-hidden border-b-4 border-yellow-500">
        
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

        <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/dashboard/partidos')} className="text-blue-200 hover:text-white flex items-center gap-2 transition">
                    <ArrowLeft size={20} /> Volver
                </button>
                
                <div className="flex flex-col items-center">
                    <MatchTimer inicioTiempo={match.inicioTiempo} tiempoJuego={match.tiempoJuego} estado={match.estado} />
                    <span className="text-xs text-yellow-400 mt-2 font-bold uppercase tracking-widest">
                        {match.estado === 'FINALIZADO' ? 'RESULTADO FINAL' : match.estado.replace('_', ' ')}
                    </span>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${match.estado === 'EN_VIVO' ? 'bg-red-600 animate-pulse' : 'bg-blue-900/50 border border-blue-400'}`}>
                    {match.estado}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-center w-1/3">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 truncate">{match.equipoLocal.nombre}</h2>
                  <div className="text-6xl md:text-7xl font-black text-white drop-shadow-lg">{match.golesLocal}</div>
                </div>
                <div className="text-yellow-500 font-bold text-2xl opacity-80">VS</div>
                <div className="text-center w-1/3">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 truncate">{match.equipoVisitante.nombre}</h2>
                  <div className="text-6xl md:text-7xl font-black text-white drop-shadow-lg">{match.golesVisitante}</div>
                </div>
            </div>

            {/* SECCIÓN DE CONTROLES */}
            <div className="mt-8 pt-6 border-t border-blue-800/50">
              
              {/* 1. BOTONERA PRINCIPAL DE TIEMPOS (CENTRADA) */}
              <div className="flex justify-center gap-4">
                {match.estado === 'PROGRAMADO' && <button onClick={() => changeStatus('EN_VIVO')} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-green-900/20"><Play size={20} /> INICIAR 1er TIEMPO</button>}
                {match.estado === 'EN_VIVO' && (match.periodo === 1 || !match.periodo) && <button onClick={() => changeStatus('ENTRETIEMPO')} className="bg-yellow-600 hover:bg-yellow-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition"><Pause size={20} /> FINALIZAR 1er TIEMPO</button>}
                {match.estado === 'ENTRETIEMPO' && <button onClick={() => changeStatus('EN_VIVO')} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition"><RotateCw size={20} /> INICIAR 2do TIEMPO</button>}
                {match.estado === 'EN_VIVO' && match.periodo === 2 && <button onClick={() => changeStatus('FINALIZADO')} className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition"><Square size={20} /> FINALIZAR PARTIDO</button>}
                {match.estado === 'FINALIZADO' && <div className="text-green-400 font-bold flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded border border-green-500/30"><CheckCircle size={16} /> PARTIDO FINALIZADO</div>}
              </div>

              {/* 2. OPCIONES ADMINISTRATIVAS (WALKOVER) - CORREGIDO (ON CLICK) */}
              {match.estado !== 'FINALIZADO' && match.estado !== 'CANCELADO' && (
                <div className="flex justify-end mt-4">
                  <div className="relative">
                    <button 
                      onClick={() => setShowWalkoverMenu(!showWalkoverMenu)} 
                      className={`text-xs font-bold flex items-center gap-1 transition px-3 py-1 rounded-full ${showWalkoverMenu ? 'bg-white text-[#002b5c]' : 'text-blue-300 hover:text-white hover:bg-blue-900/50'}`}
                    >
                      <Gavel size={14} /> Opciones Administrativas (W.O.)
                    </button>
                    
                    {/* Menú desplegable MANUAL (No hover) */}
                    {showWalkoverMenu && (
                      <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 animate-fade-in text-slate-800">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                           <p className="text-[10px] text-slate-400 uppercase font-bold">Declarar Incomparecencia</p>
                           <button onClick={() => setShowWalkoverMenu(false)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                        </div>
                        
                        <div className="space-y-2">
                          <button 
                            onClick={() => handleWalkover('LOCAL')}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex justify-between items-center group"
                          >
                            <span>Gana {match.equipoLocal.abreviatura} (3-0)</span>
                            <CheckCircle size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"/>
                          </button>
                          <button 
                            onClick={() => handleWalkover('VISITANTE')}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition flex justify-between items-center group"
                          >
                            <span>Gana {match.equipoVisitante.abreviatura} (0-3)</span>
                            <CheckCircle size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600"/>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

        </div>
      </div>

      {/* JUGADORES */}
      {(match.estado === 'EN_VIVO' || match.estado === 'ENTRETIEMPO') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LOCAL */}
          <div className="bg-white rounded-xl shadow p-4 border-t-4 border-blue-600">
            <h3 className="font-bold text-lg mb-4 text-[#002b5c]">Plantilla {match.equipoLocal.abreviatura}</h3>
            <div className="space-y-2">
              {match.equipoLocal.jugadores.map((p: any) => {
                const stats = getPlayerStatus(p.id);
                const bgColor = stats.suspendidoPrevio ? 'bg-slate-200' : (stats.expulsado ? 'bg-red-50 border-red-200' : 'hover:bg-slate-50 border-slate-100');
                const disabled = stats.expulsado || match.estado !== 'EN_VIVO';
                return (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded border ${bgColor}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${stats.expulsado ? 'bg-slate-400 text-white' : 'bg-[#002b5c] text-white'}`}>
                        {p.dorsal}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${stats.expulsado ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{p.nombre}</span>
                            {stats.suspendidoPrevio && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Ban size={10} /> SANCIONADO</span>}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[...Array(stats.amarillas)].map((_, i) => <div key={i} className="w-2 h-3 bg-yellow-400 rounded-sm border border-yellow-500 shadow-sm" />)}
                          {stats.rojas > 0 && <div className="w-2 h-3 bg-red-500 rounded-sm border border-red-600 shadow-sm" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button disabled={disabled} onClick={() => handleEvent('GOL', p.id, match.equipoLocalId)} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Gol"><Goal size={16} /></button>
                      <button disabled={disabled} onClick={() => handleEvent('TARJETA_AMARILLA', p.id, match.equipoLocalId)} className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Amarilla"><AlertTriangle size={16} /></button>
                      <button disabled={disabled} onClick={() => handleEvent('TARJETA_ROJA', p.id, match.equipoLocalId)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Roja Directa"><Square size={16} fill="currentColor" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VISITANTE */}
          <div className="bg-white rounded-xl shadow p-4 border-t-4 border-red-600">
            <h3 className="font-bold text-lg mb-4 text-red-700">Plantilla {match.equipoVisitante.abreviatura}</h3>
            <div className="space-y-2">
              {match.equipoVisitante.jugadores.map((p: any) => {
                const stats = getPlayerStatus(p.id);
                const bgColor = stats.suspendidoPrevio ? 'bg-slate-200' : (stats.expulsado ? 'bg-red-50 border-red-200' : 'hover:bg-slate-50 border-slate-100');
                const disabled = stats.expulsado || match.estado !== 'EN_VIVO';
                return (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded border ${bgColor}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${stats.expulsado ? 'bg-slate-400 text-white' : 'bg-red-700 text-white'}`}>
                        {p.dorsal}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${stats.expulsado ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{p.nombre}</span>
                            {stats.suspendidoPrevio && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Ban size={10} /> SANCIONADO</span>}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[...Array(stats.amarillas)].map((_, i) => <div key={i} className="w-2 h-3 bg-yellow-400 rounded-sm border border-yellow-500 shadow-sm" />)}
                          {stats.rojas > 0 && <div className="w-2 h-3 bg-red-500 rounded-sm border border-red-600 shadow-sm" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button disabled={disabled} onClick={() => handleEvent('GOL', p.id, match.equipoVisitanteId)} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Gol"><Goal size={16} /></button>
                      <button disabled={disabled} onClick={() => handleEvent('TARJETA_AMARILLA', p.id, match.equipoVisitanteId)} className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Amarilla"><AlertTriangle size={16} /></button>
                      <button disabled={disabled} onClick={() => handleEvent('TARJETA_ROJA', p.id, match.equipoVisitanteId)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Roja Directa"><Square size={16} fill="currentColor" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- PANEL DE LOGÍSTICA --- */}
      {match.estado === 'FINALIZADO' && (
        <div className={`bg-white rounded-xl shadow-lg border p-6 animate-fade-in ${match.controlFinalizado ? 'border-green-500 ring-1 ring-green-100' : 'border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-[#002b5c] flex items-center gap-2">
                📋 Control de Mesa Post-Partido
                {match.controlFinalizado && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><Lock size={12}/> Cerrado</span>}
             </h3>
             {!match.controlFinalizado && (
                <button 
                  onClick={finalizarControl}
                  className="bg-[#002b5c] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#001f42] transition flex items-center gap-2 border border-yellow-500"
                >
                   <Lock size={18} /> Finalizar Control
                </button>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LOCAL */}
                <div className={`p-4 rounded-xl border ${match.controlFinalizado ? 'bg-slate-50 opacity-80' : 'bg-slate-50 border-blue-200'}`}>
                   <h4 className="font-bold text-[#002b5c] mb-4">{match.equipoLocal.nombre}</h4>
                   <div className="space-y-3">
                      <LogisticaItem label="Pago Arbitraje" checked={match.pagoArbitrajeLocal} onClick={() => toggleLogistica('pagoArbitrajeLocal')} locked={match.controlFinalizado} icon={<DollarSign size={18}/>} />
                      <LogisticaItem label="Presentó Balón" checked={match.llevoBalonLocal} onClick={() => toggleLogistica('llevoBalonLocal')} locked={match.controlFinalizado} icon={<Circle size={18}/>} />
                   </div>
                </div>
                {/* VISITANTE */}
                <div className={`p-4 rounded-xl border ${match.controlFinalizado ? 'bg-slate-50 opacity-80' : 'bg-slate-50 border-red-200'}`}>
                   <h4 className="font-bold text-red-800 mb-4">{match.equipoVisitante.nombre}</h4>
                   <div className="space-y-3">
                      <LogisticaItem label="Pago Arbitraje" checked={match.pagoArbitrajeVisitante} onClick={() => toggleLogistica('pagoArbitrajeVisitante')} locked={match.controlFinalizado} icon={<DollarSign size={18}/>} />
                      <LogisticaItem label="Presentó Balón" checked={match.llevoBalonVisitante} onClick={() => toggleLogistica('llevoBalonVisitante')} locked={match.controlFinalizado} icon={<Circle size={18}/>} />
                   </div>
                </div>
            </div>

            {/* FOTO */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
               <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ImageIcon size={18}/> Foto de Planilla</h4>
               
               {match.planillaUrl ? (
                 <div className="relative group w-full aspect-[3/4] bg-slate-200 rounded-lg overflow-hidden cursor-pointer shadow-sm" onClick={() => setShowImageModal(true)}>
                    <img src={match.planillaUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Planilla" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                       <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition backdrop-blur-sm">🔍 Ver Grande</span>
                    </div>
                 </div>
               ) : (
                 <div className="w-full aspect-[3/4] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4">
                    <ImageIcon size={48} className="mb-2 opacity-50" />
                    <span className="text-sm">Sin planilla cargada</span>
                 </div>
               )}

               {!match.controlFinalizado && (
                 <div className="mt-4 w-full">
                    <input type="file" id="planillaUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <label 
                      htmlFor="planillaUpload" 
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition cursor-pointer ${
                         uploading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {uploading ? 'Subiendo...' : <><Upload size={18} /> {match.planillaUrl ? 'Cambiar Foto' : 'Subir Foto'}</>}
                    </label>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showImageModal && match.planillaUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
           <button className="absolute top-4 right-4 text-white hover:text-red-400 p-2"><X size={32}/></button>
           <img src={match.planillaUrl} className="max-w-full max-h-screen rounded shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
};

const LogisticaItem = ({ label, checked, onClick, locked, icon }: any) => (
  <div 
    onClick={!locked ? onClick : undefined}
    className={`flex items-center justify-between p-3 bg-white rounded-lg border transition ${
       locked ? 'cursor-default' : 'cursor-pointer hover:border-blue-400'
    }`}
  >
     <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${checked ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{icon}</div>
        <span className={`font-medium ${checked ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
     </div>
     {checked 
        ? <CheckCircle className="text-green-600" size={24} fill="#dcfce7" /> 
        : <Circle className="text-slate-300" size={24} />}
  </div>
);

export default ControlPartidoPage;