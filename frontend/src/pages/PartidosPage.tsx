import { useEffect, useState } from 'react';
import client from '../api/client';
import { Plus, Clock, CalendarPlus, Ban, Trash2, Filter, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Team {
  id: number;
  nombre: string;
  escudoUrl: string | null;
}

interface Match {
  id: number;
  fecha: string;
  estado: 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO' | 'CANCELADO' | 'ENTRETIEMPO';
  golesLocal: number;
  golesVisitante: number;
  equipoLocal: Team;
  equipoVisitante: Team;
  jornada: { id: number; nombre: string };
}

interface Jornada {
  id: number;
  nombre: string;
}

const PartidosPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO PARA FILTRO Y ROL ---
  const [filterJornada, setFilterJornada] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // <--- NUEVO: Para saber si es admin

  const [showModalPartido, setShowModalPartido] = useState(false);
  const [showModalJornada, setShowModalJornada] = useState(false);

  const [formData, setFormData] = useState({
    jornadaId: '',
    equipoLocalId: '',
    equipoVisitanteId: '',
    fecha: '',
    hora: ''
  });

  const [formJornada, setFormJornada] = useState({
    nombre: '',
    orden: '',
    esPlayoff: false
  });

  useEffect(() => { 
    fetchData(); 
    checkRole(); // <--- Verificamos el rol al cargar
  }, []);

  // --- 1. VERIFICAR ROL ---
  const checkRole = () => {
    const userStr = localStorage.getItem('user'); // O como hayas llamado a la key al guardar el login
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Si el rol es ADMIN, activamos los poderes
        if (user.rol === 'ADMIN') setIsAdmin(true);
      } catch (e) {
        console.error("Error leyendo usuario");
      }
    }
  };

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, jornadasRes] = await Promise.all([
        client.get('/admin/partidos'),
        client.get('/admin/equipos'),
        client.get('/admin/jornadas')
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
      setJornadas(jornadasRes.data);
    } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
  };

  const navigate = useNavigate();

  const filteredMatches = matches.filter(match => {
    if (!filterJornada) return true;
    return match.jornada.id.toString() === filterJornada;
  });

  // --- ACCIONES ---

  const handleSubmitPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fechaFinal = new Date(`${formData.fecha}T${formData.hora}:00`);
      await client.post('/admin/partidos', {
        jornadaId: formData.jornadaId,
        equipoLocalId: formData.equipoLocalId,
        equipoVisitanteId: formData.equipoVisitanteId,
        fecha: fechaFinal.toISOString()
      });
      setShowModalPartido(false);
      fetchData();
      toast.success('Partido programado ⚽'); // <--- CAMBIO
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al programar'); // <--- CAMBIO
    }
  };

  const handleSubmitJornada = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admin/jornadas', {
        nombre: formJornada.nombre,
        orden: Number(formJornada.orden),
        esPlayoff: formJornada.esPlayoff,
        campeonatoId: 1
      });
      setShowModalJornada(false);
      setFormJornada({ nombre: '', orden: '', esPlayoff: false });
      fetchData();
      toast.success('Fase creada ✅'); // <--- CAMBIO
    } catch (error) { 
      toast.error('Error al crear jornada'); // <--- CAMBIO
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de CANCELAR este partido?\nQuedará como suspendido.')) return;
    try {
      await client.patch(`/admin/partidos/${id}/estado`, { estado: 'CANCELADO' });
      fetchData();
      toast.success('Partido cancelado'); // <--- CAMBIO (Agregado feedback visual)
    } catch (error) { 
      toast.error('Error al cancelar'); // <--- CAMBIO
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Borrar definitivamente este partido?\nÚsalo si hubo un error al programarlo.')) return;
    try {
      await client.delete(`/admin/partidos/${id}`);
      fetchData();
      toast.success('Partido eliminado 🗑️'); // <--- CAMBIO
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar'); // <--- CAMBIO
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_VIVO': return 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse';
      case 'ENTRETIEMPO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'FINALIZADO': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'CANCELADO': return 'bg-red-50 text-red-600 line-through';
      default: return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Partidos</h1>
          <p className="text-slate-500">Programación y Resultados</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          
          {/* SELECTOR DE FILTRO (Visible para todos) */}
          <div className="relative flex-1 xl:flex-none min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Filter size={18} />
            </div>
            <select 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-400 transition"
              value={filterJornada}
              onChange={(e) => setFilterJornada(e.target.value)}
            >
              <option value="">Todas las Jornadas</option>
              {jornadas.map(j => (
                <option key={j.id} value={j.id}>{j.nombre}</option>
              ))}
            </select>
          </div>
          
          {/* --- 2. BOTONES SOLO PARA ADMIN --- */}
          {isAdmin && (
            <>
              <div className="h-8 w-px bg-slate-300 hidden xl:block mx-1"></div>
              <button onClick={() => setShowModalJornada(true)} className="flex-1 xl:flex-none bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm font-medium">
                <CalendarPlus size={20} className="text-purple-600"/> <span>Nueva Jornada</span>
              </button>
              <button onClick={() => setShowModalPartido(true)} className="flex-1 xl:flex-none bg-[#002b5c] border-b-2 border-yellow-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm font-bold">
                <Plus size={20} /> <span>Programar</span>
              </button>
            </>
          )}

          {/* MENSAJE PARA OFICIALES (Opcional) */}
          {!isAdmin && (
            <div className="flex items-center gap-2 text-slate-400 text-sm italic px-2">
              <Lock size={14} /> Vista de Oficial
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredMatches.map((match) => {
          const fechaObj = new Date(match.fecha);
          return (
            <div key={match.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 transition">
              
              <div className="flex flex-col mb-2 md:mb-0 w-48">
                <span className="font-bold text-slate-700">{fechaObj.toLocaleDateString()} <span className="text-xs text-slate-400 font-normal ml-1">{match.jornada.nombre}</span></span>
                <span className="text-sm text-slate-500 flex items-center gap-1"><Clock size={14} /> {fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-8">
                <div className="flex items-center gap-3 w-40 justify-end">
                  <span className="font-bold text-slate-800 text-right">{match.equipoLocal.nombre}</span>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                     {match.equipoLocal.escudoUrl ? <img src={match.equipoLocal.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800">
                    {match.estado === 'CANCELADO' ? 'X' : (match.estado === 'PROGRAMADO' ? 'vs' : `${match.golesLocal} - ${match.golesVisitante}`)}
                  </span>
                </div>
                <div className="flex items-center gap-3 w-40 justify-start">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                    {match.equipoVisitante.escudoUrl ? <img src={match.equipoVisitante.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
                  </div>
                  <span className="font-bold text-slate-800 text-left">{match.equipoVisitante.nombre}</span>
                </div>
              </div>

              <div className="w-32 flex flex-col items-end gap-2 mt-2 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(match.estado)}`}>{match.estado}</span>
                
                <div className="flex items-center gap-2 mt-1">
                    {/* El botón Gestionar lo ven todos (Admin y Oficial) */}
                    {match.estado !== 'CANCELADO' && (
                        <button onClick={() => navigate(`/dashboard/partido/${match.id}`)} className="text-xs text-blue-600 font-bold hover:underline" title="Ir a Mesa de Control">
                            Gestionar
                        </button>
                    )}

                    {/* --- 3. BOTONES DE EDICIÓN SOLO PARA ADMIN --- */}
                    {isAdmin && match.estado === 'PROGRAMADO' && (
                        <>
                            <button onClick={() => handleCancel(match.id)} className="text-orange-500 hover:text-orange-700" title="Cancelar/Suspender">
                                <Ban size={16} />
                            </button>
                            <button onClick={() => handleDelete(match.id)} className="text-red-500 hover:text-red-700" title="Eliminar definitivamente">
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
              </div>

            </div>
          );
        })}
        {filteredMatches.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Filter size={48} className="opacity-20"/>
            <p>No hay partidos en esta jornada o aún no se han programado.</p>
          </div>
        )}
      </div>

      {/* --- MODALES TAMBIÉN PROTEGIDOS --- */}
      {isAdmin && showModalPartido && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Programar Encuentro</h2>
            <form onSubmit={handleSubmitPartido} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jornada</label>
                <select className="w-full border p-2 rounded" value={formData.jornadaId} onChange={e => setFormData({...formData, jornadaId: e.target.value})} required>
                  <option value="">Seleccione jornada...</option>
                  {jornadas.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Local</label>
                  <select className="w-full border p-2 rounded" value={formData.equipoLocalId} onChange={e => setFormData({...formData, equipoLocalId: e.target.value})} required>
                    <option value="">Seleccione...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Visitante</label>
                  <select className="w-full border p-2 rounded" value={formData.equipoVisitanteId} onChange={e => setFormData({...formData, equipoVisitanteId: e.target.value})} required>
                     <option value="">Seleccione...</option>
                     {teams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <input type="date" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, fecha: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora</label>
                  <input type="time" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, hora: e.target.value})} required />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setShowModalPartido(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#002b5c] border-b-2 border-yellow-500 text-white rounded font-bold hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmin && showModalJornada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CalendarPlus className="text-purple-600" /> Crear Jornada o Fase
            </h2>
            <form onSubmit={handleSubmitJornada} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Fase</label>
                <input type="text" placeholder='Ej: "Cuartos de Final"' className="w-full border p-2 rounded" value={formJornada.nombre} onChange={e => setFormJornada({...formJornada, nombre: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Orden</label>
                <input type="number" placeholder='Ej: 1' className="w-full border p-2 rounded" value={formJornada.orden} onChange={e => setFormJornada({...formJornada, orden: e.target.value})} required />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="esPlayoff" className="w-4 h-4 text-purple-600 rounded" checked={formJornada.esPlayoff} onChange={e => setFormJornada({...formJornada, esPlayoff: e.target.checked})} />
                <label htmlFor="esPlayoff" className="text-sm font-medium text-slate-700">Es Eliminatoria (Playoff)</label>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setShowModalJornada(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700">Crear Fase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartidosPage;