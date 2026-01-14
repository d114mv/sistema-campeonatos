import { useEffect, useState } from 'react';
import client from '../api/client';
import { Shield, Plus, Trash2, Pencil, X, Upload, Search, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Career {
  id: number;
  nombre: string;
}

interface Team {
  id: number;
  nombre: string;
  abreviatura: string;
  escudoUrl: string;
  campus: string;
  carrera: Career;
}

const EquiposPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal y Edición
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estado de subida de imagen
  const [uploading, setUploading] = useState(false);

  // --- CONFIGURACIÓN CLOUDINARY (Usa las mismas que en ControlPartido) ---
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET; 

  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    escudoUrl: '',
    campus: 'Campus Central',
    carreraId: '',
    campeonatoId: 1 // Asumimos campeonato 1 por defecto
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, careersRes] = await Promise.all([
        client.get('/admin/equipos'),
        client.get('/admin/carreras') // Asegúrate de tener este endpoint o usar getCarreras del controller
      ]);
      setTeams(teamsRes.data);
      setCareers(careersRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- SUBIR ESCUDO A CLOUDINARY ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      
      if (fileData.secure_url) {
        setFormData({ ...formData, escudoUrl: fileData.secure_url });
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await client.put(`/admin/equipos/${editingId}`, formData);
        toast.success('Equipo actualizado ✅'); // <--- CAMBIO
      } else {
        await client.post('/admin/equipos', formData);
        toast.success('Equipo creado correctamente ⚽'); // <--- CAMBIO
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error('Error al guardar equipo'); // <--- CAMBIO
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar equipo? Esto borrará sus partidos y jugadores.')) return;
    try {
      await client.delete(`/admin/equipos/${id}`);
      setTeams(teams.filter(t => t.id !== id));
      toast.success('Equipo eliminado'); // <--- AGREGADO
    } catch (error) {
      toast.error('No se puede eliminar: El equipo tiene historial.'); // <--- CAMBIO
    }
  };

  const openEdit = (team: Team) => {
    setEditingId(team.id);
    setFormData({
      nombre: team.nombre,
      abreviatura: team.abreviatura,
      escudoUrl: team.escudoUrl || '',
      campus: team.campus,
      carreraId: team.carrera.id.toString(),
      campeonatoId: 1
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nombre: '', abreviatura: '', escudoUrl: '', campus: 'Campus Central', carreraId: '', campeonatoId: 1 });
  };

  // Filtrado
  const filteredTeams = teams.filter(t => 
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.carrera.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Equipos Participantes</h1>
          <p className="text-slate-500">Gestión de clubes y escudos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#002b5c] border-b-2 border-yellow-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/20">
          <Plus size={20} /> Nuevo Equipo
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o carrera..." 
          className="w-full outline-none text-slate-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID DE EQUIPOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? <p>Cargando equipos...</p> : filteredTeams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md transition group relative">
            
            {/* Botones Flotantes (Solo visibles al hover) */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => openEdit(team)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Pencil size={16}/></button>
              <button onClick={() => handleDelete(team.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 size={16}/></button>
            </div>

            <div className="w-24 h-24 bg-slate-50 rounded-full mb-4 flex items-center justify-center overflow-hidden border border-slate-100">
               {team.escudoUrl ? (
                 <img src={team.escudoUrl} alt={team.nombre} className="w-full h-full object-cover" />
               ) : (
                 <Shield size={40} className="text-slate-300" />
               )}
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{team.nombre}</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2">{team.abreviatura}</span>
            <p className="text-sm text-slate-500">{team.carrera?.nombre}</p>
          </div>
        ))}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Editar Equipo' : 'Registrar Equipo'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* SUBIDA DE ESCUDO */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 mb-2 relative">
                  {formData.escudoUrl ? (
                    <img src={formData.escudoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                  {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">Subiendo...</div>}
                </div>
                
                <input type="file" id="escudoUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <label htmlFor="escudoUpload" className="text-sm text-blue-600 font-bold cursor-pointer hover:underline flex items-center gap-1">
                  <Upload size={14}/> {formData.escudoUrl ? 'Cambiar Escudo' : 'Subir Escudo'}
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Nombre del Equipo</label>
                <input type="text" required className="w-full border p-2 rounded" placeholder="Ej: Lobos de Sistemas" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Abreviatura</label>
                  <input type="text" required className="w-full border p-2 rounded" placeholder="Ej: SIS" maxLength={3} value={formData.abreviatura} onChange={e => setFormData({...formData, abreviatura: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Campus</label>
                  <select className="w-full border p-2 rounded" value={formData.campus} onChange={e => setFormData({...formData, campus: e.target.value})}>
                    <option>Campus Lanza</option>
                    <option>Campus 23 de Marzo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Carrera</label>
                <select className="w-full border p-2 rounded" required value={formData.carreraId} onChange={e => setFormData({...formData, carreraId: e.target.value})}>
                  <option value="">Seleccione carrera...</option>
                  {careers.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <button disabled={uploading} type="submit" className="w-full bg-[#002b5c] border-b-2 border-yellow-500 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
                {editingId ? 'Guardar Cambios' : 'Registrar Equipo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquiposPage;