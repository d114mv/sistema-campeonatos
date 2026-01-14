import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { UserPlus, Trash2, ArrowLeft, Shield, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Player {
  id: number;
  nombre: string;
  dorsal: number;
  posicion: string;
}

interface Team {
  id: number;
  nombre: string;
  escudoUrl: string | null;
}

const PlantillaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CORRECCIÓN AQUÍ ---
  // Inicializamos en 'PORTERO' para que coincida con la primera opción del select
  const [formData, setFormData] = useState({
    nombre: '',
    dorsal: '',
    posicion: 'PORTERO' 
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const teamsRes = await client.get('/admin/equipos');
      const foundTeam = teamsRes.data.find((t: Team) => t.id === Number(id));
      setTeam(foundTeam);

      const playersRes = await client.get(`/admin/equipos/${id}/jugadores`);
      setPlayers(playersRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admin/jugadores', {
        nombre: formData.nombre,
        dorsal: Number(formData.dorsal),
        posicion: formData.posicion,
        equipoId: Number(id)
      });

      // Al limpiar, volvemos a poner 'PORTERO' para el siguiente
      setFormData({ nombre: '', dorsal: '', posicion: 'PORTERO' });
      
      const res = await client.get(`/admin/equipos/${id}/jugadores`);
      setPlayers(res.data);
      toast.success('Jugador registrado correctamente ✅');
    } catch (error) {
      toast.error('Error al registrar. Verifica el dorsal.');
    }
  };

  const handleDelete = async (playerId: number) => {
    if (!confirm('¿Eliminar a este jugador?')) return;
    try {
      await client.delete(`/admin/jugadores/${playerId}`);
      setPlayers(players.filter(p => p.id !== playerId));
      toast.success('Jugador eliminado'); // <--- AGREGADO
    } catch (error) {
      toast.error('Error al eliminar'); // <--- CAMBIO
    }
  };

  const getPosIcon = (pos: string) => {
    if (pos === 'PORTERO') return <Shield size={14} className="text-green-600" />;
    return <Users size={14} className="text-slate-400" />;
  };

  if (loading) return <div>Cargando plantilla...</div>;
  if (!team) return <div>Equipo no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <button onClick={() => navigate('/dashboard/equipos')} className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft size={24} className="text-slate-500" />
        </button>
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
           {team.escudoUrl ? <img src={team.escudoUrl} className="w-full h-full object-cover"/> : '🛡️'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{team.nombre}</h1>
          <p className="text-slate-500">Gestión de Plantilla ({players.length} jugadores)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-blue-600"/> Nuevo Jugador
            </h2>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Juan Pérez"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dorsal</label>
                  <input 
                    type="number" 
                    required
                    placeholder="10"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.dorsal}
                    onChange={e => setFormData({...formData, dorsal: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Posición</label>
                  <select 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.posicion}
                    onChange={e => setFormData({...formData, posicion: e.target.value})}
                  >
                    <option value="PORTERO">Portero</option>
                    <option value="CIERRE">Cierre</option>
                    <option value="ALA">Ala</option>
                    <option value="PÍVOT">Pívot</option>
                  </select>
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                Agregar a la Lista
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 w-16 text-center">#</th>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Posición</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-800 text-white font-bold rounded-full text-xs">
                        {player.dorsal}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{player.nombre}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 w-fit ${
                        player.posicion === 'PORTERO' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {getPosIcon(player.posicion)}
                        {player.posicion}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(player.id)}
                        className="text-slate-400 hover:text-red-600 transition p-2"
                        title="Eliminar Jugador"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {players.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                      No hay jugadores registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlantillaPage;