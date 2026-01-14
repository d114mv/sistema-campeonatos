import { useEffect, useState } from 'react';
import client from '../api/client';
import { Users, UserPlus, Trash2, Shield, UserCog, Pencil, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'OFICIAL';
}

const UsuariosPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para saber a quién estamos editando (null = modo creación)
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'OFICIAL'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await client.get('/admin/usuarios');
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA UNIFICADA: CREAR O EDITAR ---
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editingId) {
      await client.put(`/admin/usuarios/${editingId}`, formData);
      toast.success('Usuario actualizado correctamente'); // <--- AQUI
    } else {
      await client.post('/admin/usuarios', formData);
      toast.success('Usuario creado con éxito'); // <--- AQUI
    }
    resetForm();
    fetchUsers();
  } catch (error) {
    toast.error('Error al guardar. Verifica el email.'); // <--- AQUI
  }
};

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Perderá el acceso.')) return;
    try {
      await client.delete(`/admin/usuarios/${id}`);
      setUsers(users.filter(u => u.id !== id));
      // Si borramos al que estábamos editando, limpiamos el form
      if (editingId === id) resetForm();
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  // Cargar datos en el formulario para editar
  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      password: '', // La contraseña se deja vacía por seguridad
      rol: user.rol
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'OFICIAL' });
  };

  if (loading) return <div className="p-8 text-center">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="text-blue-600" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Accesos</h1>
          <p className="text-slate-500">Crea y modifica cuentas para Administradores y Oficiales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO (INTELIGENTE) */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-xl shadow-lg border sticky top-6 transition-colors ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold flex items-center gap-2 ${editingId ? 'text-yellow-700' : 'text-slate-700'}`}>
                {editingId ? <Pencil size={20} /> : <UserPlus size={20} />}
                {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              {editingId && (
                <button onClick={resetForm} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 bg-white px-2 py-1 rounded border">
                  <X size={12}/> Cancelar
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  placeholder="Ej: Pedro Mesa"
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  placeholder="oficial@emi.edu.bo"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                </label>
                <input 
                  type="password" 
                  // Si estamos editando, no es obligatorio. Si creamos, sí.
                  required={!editingId}
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  placeholder={editingId ? "Dejar en blanco para mantener" : "********"}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                {editingId && <p className="text-[10px] text-slate-500 mt-1">Solo escribe si deseas cambiarla.</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Rol / Permisos</label>
                <select 
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.rol}
                  onChange={e => setFormData({...formData, rol: e.target.value})}
                >
                  <option value="OFICIAL">Oficial de Mesa (Limitado)</option>
                  <option value="ADMIN">Administrador (Total)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className={`w-full text-white font-bold py-2 rounded-lg transition flex justify-center gap-2 ${
                  editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {editingId ? <><Save size={20} /> Guardar Cambios</> : <><UserPlus size={20} /> Crear Cuenta</>}
              </button>
            </form>
          </div>
        </div>

        {/* LISTA DE USUARIOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              Usuarios del Sistema ({users.length})
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className={`p-4 flex items-center justify-between transition ${editingId === user.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.rol === 'ADMIN' ? <Shield size={20} /> : <Users size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{user.nombre}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold mr-2 ${
                      user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.rol}
                    </span>
                    
                    {/* BOTÓN EDITAR */}
                    <button 
                      onClick={() => handleEdit(user)}
                      className="text-slate-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50"
                      title="Editar usuario"
                    >
                      <Pencil size={18} />
                    </button>

                    {/* BOTÓN ELIMINAR */}
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="text-slate-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UsuariosPage;