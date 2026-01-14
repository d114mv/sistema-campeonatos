const DashboardHome = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen del Torneo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Equipos Registrados</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">2</p>
          <div className="mt-4 text-xs text-green-600 font-medium">Lobos, Águilas...</div>
        </div>

        {/* Tarjeta 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Partidos Programados</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">1</p>
          <div className="mt-4 text-xs text-blue-600 font-medium">Próximo: Fecha 1</div>
        </div>

        {/* Tarjeta 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Estado</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">En curso</p>
          <div className="mt-4 text-xs text-orange-600 font-medium">Fase de Grupos</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;