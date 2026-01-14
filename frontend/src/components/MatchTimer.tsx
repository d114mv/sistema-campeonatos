import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  inicioTiempo: string | null; // Viene de la DB (ISO string)
  tiempoJuego: number;         // Segundos acumulados
  estado: string;
}

const MatchTimer = ({ inicioTiempo, tiempoJuego, estado }: Props) => {
  const [segundos, setSegundos] = useState(tiempoJuego);

  useEffect(() => {
    // Si el partido está detenido, mostramos solo lo acumulado
    if (!inicioTiempo || estado !== 'EN_VIVO') {
      setSegundos(tiempoJuego);
      return;
    }

    // Si está EN VIVO, calculamos la diferencia real
    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const inicio = new Date(inicioTiempo).getTime();
      const diff = Math.floor((ahora - inicio) / 1000);
      setSegundos(tiempoJuego + diff);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [inicioTiempo, tiempoJuego, estado]);

  // Formatear MM:SS
  const formatTime = (totalSegundos: number) => {
    const min = Math.floor(totalSegundos / 60);
    const seg = totalSegundos % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  // Cambiar color según el tiempo (ej: rojo si pasa de 15 min)
  const textColor = segundos > 15 * 60 ? 'text-red-400 animate-pulse' : 'text-white';

  return (
    <div className={`font-mono text-3xl font-bold flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg border border-white/10 ${textColor}`}>
      <Clock size={24} />
      {formatTime(segundos)}
    </div>
  );
};

export default MatchTimer;