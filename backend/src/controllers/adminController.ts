import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- 1. Crear Campeonato ---
export const createChampionship = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, fechaInicio, tipo } = req.body;

    const newChamp = await prisma.championship.create({
      data: {
        nombre,
        fechaInicio: new Date(fechaInicio), // Convertimos texto a fecha real
        tipo: tipo || 'FUTSAL', // Por defecto Futsal
        estado: true
      }
    });

    res.status(201).json({ message: 'Campeonato creado', campeonato: newChamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear campeonato' });
  }
};

// --- 2. Crear Equipo ---
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      nombre, 
      abreviatura, 
      escudoUrl, 
      campus, 
      carreraId, 
      campeonatoId 
    } = req.body;

    // Validación básica
    if (!carreraId || !campeonatoId) {
       res.status(400).json({ error: 'Falta ID de carrera o campeonato' });
       return;
    }

    const newTeam = await prisma.team.create({
      data: {
        nombre,
        abreviatura,
        escudoUrl, // Por ahora enviaremos un string, luego integraremos Cloudinary
        campus,
        carreraId: Number(carreraId),
        campeonatoId: Number(campeonatoId)
      }
    });

    res.status(201).json({ message: 'Equipo registrado con éxito', equipo: newTeam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar equipo' });
  }
};

// --- 3. Listar Carreras (Utilidad para saber qué ID enviar) ---
export const getCarreras = async (req: AuthRequest, res: Response) => {
    const carreras = await prisma.career.findMany();
    res.json(carreras);
};

// --- 4. Registrar Jugador ---
export const createPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, dorsal, posicion, equipoId } = req.body;

    const newPlayer = await prisma.player.create({
      data: {
        nombre,
        dorsal: Number(dorsal),
        posicion,
        equipoId: Number(equipoId)
      }
    });

    res.status(201).json({ message: 'Jugador registrado', player: newPlayer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar jugador' });
  }
};

// --- 5. Crear Jornada (Ej: "Fecha 1") ---
export const createMatchday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // AHORA LEEMOS 'esPlayoff' DEL BODY
    const { nombre, orden, campeonatoId, esPlayoff } = req.body;

    const newJornada = await prisma.matchday.create({
      data: {
        nombre,              // Ej: "Jornada 5" o "Gran Final"
        orden: Number(orden), 
        campeonatoId: Number(campeonatoId),
        esPlayoff: esPlayoff || false // Si no envían nada, es false
      }
    });

    res.status(201).json({ message: 'Fase creada', jornada: newJornada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear jornada' });
  }
};

// --- 6. Programar Partido (Con validación de fecha) ---
export const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jornadaId, equipoLocalId, equipoVisitanteId, fecha } = req.body;

    // 1. Validar equipos distintos
    if (equipoLocalId === equipoVisitanteId) {
       res.status(400).json({ error: 'El equipo local y visitante no pueden ser el mismo' });
       return;
    }

    // 2. Validar fecha futura (NUEVO)
    const fechaPartido = new Date(fecha);
    const ahora = new Date();
    if (fechaPartido < ahora) {
      res.status(400).json({ error: 'No puedes programar partidos en el pasado.' });
      return;
    }

    const newMatch = await prisma.match.create({
      data: {
        jornadaId: Number(jornadaId),
        equipoLocalId: Number(equipoLocalId),
        equipoVisitanteId: Number(equipoVisitanteId),
        fecha: fechaPartido,
        estado: 'PROGRAMADO'
      }
    });

    res.status(201).json({ message: 'Partido programado exitosamente', match: newMatch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al programar partido' });
  }
};

// --- 7. Listar Equipos ---
export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        carrera: true // Esto trae el nombre de la carrera, no solo el ID
      },
      orderBy: { id: 'desc' } // Los más nuevos primero
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

// --- 8. Listar Partidos (Con nombres de equipos) ---
export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        equipoLocal: true,     // Traer datos del local
        equipoVisitante: true, // Traer datos del visitante
        jornada: true          // Saber qué fecha es
      },
      orderBy: { fecha: 'asc' } // Ordenar por fecha (próximos primero)
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
};

// --- 9. Listar Jornadas ---
export const getMatchdays = async (req: AuthRequest, res: Response) => {
  try {
    const jornadas = await prisma.matchday.findMany({
      orderBy: { orden: 'asc' }
    });
    res.json(jornadas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener jornadas' });
  }
};

// --- 10. Obtener Detalle de Partido (Con Jugadores) ---
export const getMatchDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({
      where: { id: Number(id) },
      include: {
        jornada: true,
        equipoLocal: {
          include: { jugadores: true } // Traemos la plantilla
        },
        equipoVisitante: {
          include: { jugadores: true } // Traemos la plantilla
        },
        eventos: {
          include: { jugador: true }, // Traemos el historial de eventos
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el partido' });
  }
};

// --- 11. Registrar Evento (Gol, Tarjeta, etc.) ---
export const addMatchEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partidoId, tipo, jugadorId, minuto, equipoId } = req.body; // equipoId sirve para saber a quién sumar el gol

    // 1. Crear el evento en el historial
    const evento = await prisma.matchEvent.create({
      data: {
        partidoId: Number(partidoId),
        tipo, // 'GOL', 'TARJETA_AMARILLA', etc.
        jugadorId: jugadorId ? Number(jugadorId) : null,
        minuto: Number(minuto)
      }
    });

    // 2. Si es GOL, actualizamos el marcador del partido
    if (tipo === 'GOL') {
       // Necesitamos saber si el equipo es Local o Visitante para sumar
       const partido = await prisma.match.findUnique({ where: { id: Number(partidoId) } });
       
       if (partido) {
         if (partido.equipoLocalId === Number(equipoId)) {
           await prisma.match.update({
             where: { id: Number(partidoId) },
             data: { golesLocal: { increment: 1 } }
           });
         } else {
           await prisma.match.update({
             where: { id: Number(partidoId) },
             data: { golesVisitante: { increment: 1 } }
           });
         }
       }
    }

    res.status(201).json({ message: 'Evento registrado', evento });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar evento' });
  }
};

// --- 12. Actualizar Estado (Con lógica de Tiempos) ---
export const updateMatchStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'EN_VIVO', 'ENTRETIEMPO', 'FINALIZADO'

    const matchPrevio = await prisma.match.findUnique({ where: { id: Number(id) } });

    if (!matchPrevio) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    let dataToUpdate: any = { estado };
    const ahora = new Date();

    // 1. PAUSAR EL RELOJ (Ir al descanso o Finalizar)
    if ((estado === 'ENTRETIEMPO' || estado === 'FINALIZADO') && matchPrevio.inicioTiempo) {
      const inicio = new Date(matchPrevio.inicioTiempo).getTime();
      const fin = ahora.getTime();
      const diffSegundos = Math.floor((fin - inicio) / 1000);
      
      dataToUpdate.tiempoJuego = matchPrevio.tiempoJuego + diffSegundos;
      dataToUpdate.inicioTiempo = null; // Detenemos reloj
    }

    // 2. INICIAR O REANUDAR RELOJ
    if (estado === 'EN_VIVO') {
      dataToUpdate.inicioTiempo = ahora;
      
      // LOGICA NUEVA: Si venimos del Entretiempo, pasamos al 2do Periodo
      if (matchPrevio.estado === 'ENTRETIEMPO') {
        dataToUpdate.periodo = 2; 
      }
    }

    const match = await prisma.match.update({
      where: { id: Number(id) },
      data: dataToUpdate
    });

    res.json(match);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// --- 13. Calcular Tabla de Posiciones ---
export const getStandings = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Traer todos los equipos y todos los partidos FINALIZADOS
    const teams = await prisma.team.findMany();
    const matches = await prisma.match.findMany({
      where: { estado: 'FINALIZADO' }
    });

    // 2. Inicializar la tabla con 0 puntos para todos
    const tabla = teams.map(team => ({
      id: team.id,
      nombre: team.nombre,
      escudoUrl: team.escudoUrl,
      pj: 0, // Partidos Jugados
      pg: 0, // Ganados
      pe: 0, // Empatados
      pp: 0, // Perdidos
      gf: 0, // Goles a Favor
      gc: 0, // Goles en Contra
      dg: 0, // Diferencia de Gol
      pts: 0 // Puntos
    }));

    // 3. Recorrer los partidos y sumar stats
    matches.forEach(match => {
      // Buscar los equipos en nuestra tabla temporal
      const local = tabla.find(t => t.id === match.equipoLocalId);
      const visit = tabla.find(t => t.id === match.equipoVisitanteId);

      if (local && visit) {
        // Sumar Partidos Jugados
        local.pj++;
        visit.pj++;

        // Sumar Goles
        local.gf += match.golesLocal;
        local.gc += match.golesVisitante;
        local.dg = local.gf - local.gc;

        visit.gf += match.golesVisitante;
        visit.gc += match.golesLocal;
        visit.dg = visit.gf - visit.gc;

        // Asignar Puntos (3-1-0)
        if (match.golesLocal > match.golesVisitante) {
          local.pg++;
          local.pts += 3;
          visit.pp++;
        } else if (match.golesLocal < match.golesVisitante) {
          visit.pg++;
          visit.pts += 3;
          local.pp++;
        } else {
          local.pe++;
          local.pts += 1;
          visit.pe++;
          visit.pts += 1;
        }
      }
    });

    // 4. Ordenar la tabla: Puntos > Diferencia de Gol > Goles a Favor
    tabla.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts; // Mayor puntaje
      if (b.dg !== a.dg) return b.dg - a.dg;     // Mejor diferencia
      return b.gf - a.gf;                        // Más goles
    });

    res.json(tabla);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular posiciones' });
  }
};

// --- 14. Actualizar Equipo (EDITAR) ---
export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, abreviatura, escudoUrl, campus, carreraId } = req.body;

    const updatedTeam = await prisma.team.update({
      where: { id: Number(id) },
      data: {
        nombre,
        abreviatura,
        escudoUrl,
        campus,
        carreraId: Number(carreraId)
      }
    });

    res.json({ message: 'Equipo actualizado', team: updatedTeam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// --- 15. Eliminar Equipo (BORRAR) ---
export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Intentamos borrar
    await prisma.team.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error: any) {
    console.error(error);
    // El error P2003 de Prisma significa que hay datos relacionados (Foreign Key)
    if (error.code === 'P2003') {
      res.status(400).json({ error: 'No se puede eliminar: El equipo tiene jugadores o partidos asociados.' });
    } else {
      res.status(500).json({ error: 'Error al eliminar equipo' });
    }
  }
};

// --- 16. Listar Jugadores de un Equipo ---
export const getPlayersByTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const players = await prisma.player.findMany({
      where: { equipoId: Number(teamId) },
      orderBy: { dorsal: 'asc' } // Ordenar por número de camiseta
    });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener jugadores' });
  }
};

// --- 17. Eliminar Jugador ---
export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.player.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Jugador eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar jugador' });
  }
};

// --- 5. Obtener Partido por ID (Con chequeo de sanciones) ---
// --- 5. Obtener Partido por ID (Con chequeo de sanciones) ---
export const getMatchById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const matchId = Number(id);

    // 1. Buscamos el partido actual
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        equipoLocal: { include: { jugadores: { orderBy: { dorsal: 'asc' } } } },
        equipoVisitante: { include: { jugadores: { orderBy: { dorsal: 'asc' } } } },
        jornada: true,
        eventos: true 
      }
    });

    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

    // 2. FUNCIÓN AUXILIAR: Buscar expulsados del partido ANTERIOR
    const getSancionados = async (teamId: number) => {
      // Buscamos el último partido FINALIZADO de este equipo
      const lastMatch = await prisma.match.findFirst({
        where: {
          OR: [{ equipoLocalId: teamId }, { equipoVisitanteId: teamId }],
          estado: 'FINALIZADO',
          id: { not: matchId }
        },
        orderBy: { fecha: 'desc' },
        include: { 
          eventos: {
            include: { jugador: true } // <--- ¡AQUÍ ESTÁ LA CORRECCIÓN! (Traemos al jugador)
          } 
        }
      });

      if (!lastMatch) return [];

      // Filtramos quiénes recibieron ROJA verificando el equipo del JUGADOR
      const expulsados = lastMatch.eventos
        .filter(e => 
          e.tipo === 'TARJETA_ROJA' && 
          e.jugador && // Verificamos que el jugador exista
          e.jugador.equipoId === teamId // Usamos el equipo del jugador, no del evento
        )
        .map(e => e.jugadorId);

      // Eliminamos posibles nulos
      return expulsados.filter((id): id is number => id !== null);
    };

    // 3. Obtenemos las listas de sancionados
    const sancionadosLocal = await getSancionados(match.equipoLocalId);
    const sancionadosVisitante = await getSancionados(match.equipoVisitanteId);

    // Unimos las listas
    const idsSancionados = [...sancionadosLocal, ...sancionadosVisitante];

    // 4. Enviamos todo al frontend
    res.json({ ...match, idsSancionados });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener partido' });
  }
};

// --- 18. Obtener Estadísticas Completas ---
export const getPlayerStats = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Top Goleadores
    const goleadores = await prisma.player.findMany({
      where: { eventos: { some: { tipo: 'GOL' } } },
      select: {
        id: true, nombre: true, dorsal: true,
        equipo: { select: { nombre: true, escudoUrl: true } },
        _count: { select: { eventos: { where: { tipo: 'GOL' } } } }
      },
      orderBy: { eventos: { _count: 'desc' } },
      take: 10
    });

    const rankingGoleadores = goleadores.map(p => ({
      id: p.id, nombre: p.nombre, dorsal: p.dorsal,
      equipo: p.equipo.nombre, escudoUrl: p.equipo.escudoUrl,
      goles: p._count.eventos
    }));

    // 2. Top Tarjetas
    const amonestados = await prisma.player.findMany({
      where: { eventos: { some: { tipo: { in: ['TARJETA_AMARILLA', 'TARJETA_ROJA'] } } } },
      select: {
        id: true, nombre: true,
        equipo: { select: { nombre: true } },
        eventos: {
          where: { tipo: { in: ['TARJETA_AMARILLA', 'TARJETA_ROJA'] } },
          select: { tipo: true }
        }
      },
      take: 10
    });

    const rankingTarjetas = amonestados.map(p => ({
      id: p.id, nombre: p.nombre, equipo: p.equipo.nombre,
      amarillas: p.eventos.filter(e => e.tipo === 'TARJETA_AMARILLA').length,
      rojas: p.eventos.filter(e => e.tipo === 'TARJETA_ROJA').length,
      total: p.eventos.length
    })).sort((a, b) => b.total - a.total);

    // --- 3. NUEVO: Valla Menos Vencida (Arqueros) ---
    // A) Traer todos los arqueros
    const arqueros = await prisma.player.findMany({
      where: { posicion: 'PORTERO' },
      include: { equipo: true }
    });

    // B) Calcular goles en contra de cada equipo (usando partidos finalizados)
    const matches = await prisma.match.findMany({ where: { estado: 'FINALIZADO' } });
    
    // Objeto auxiliar: { equipoId: golesContra }
    const golesContraPorEquipo: Record<number, number> = {};
    
    matches.forEach(m => {
      // Inicializar si no existe
      if (!golesContraPorEquipo[m.equipoLocalId]) golesContraPorEquipo[m.equipoLocalId] = 0;
      if (!golesContraPorEquipo[m.equipoVisitanteId]) golesContraPorEquipo[m.equipoVisitanteId] = 0;

      // Sumar goles recibidos (Si soy local, recibí los del visitante)
      golesContraPorEquipo[m.equipoLocalId] += m.golesVisitante;
      golesContraPorEquipo[m.equipoVisitanteId] += m.golesLocal;
    });

    // C) Asignar goles a cada arquero y ordenar
    const rankingArqueros = arqueros.map(arq => ({
      id: arq.id,
      nombre: arq.nombre,
      equipo: arq.equipo.nombre,
      escudoUrl: arq.equipo.escudoUrl,
      golesRecibidos: golesContraPorEquipo[arq.equipoId] || 0
    })).sort((a, b) => a.golesRecibidos - b.golesRecibidos); // Menor es mejor

    // Enviamos las 3 listas
    res.json({ 
      goleadores: rankingGoleadores, 
      tarjetas: rankingTarjetas, 
      vallaMenosVencida: rankingArqueros 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
};

// --- 19. Eliminar Partido (Solo si no ha iniciado) ---
export const deleteMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificamos estado antes de borrar
    const match = await prisma.match.findUnique({ where: { id: Number(id) } });
    
    if (!match) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    if (match.estado === 'EN_VIVO' || match.estado === 'FINALIZADO') {
       res.status(400).json({ error: 'No se puede eliminar un partido que ya inició o terminó.' });
       return;
    }

    // Borramos primero los eventos asociados (si hubiera, aunque no debería)
    await prisma.matchEvent.deleteMany({ where: { partidoId: Number(id) } });
    
    // Borramos el partido
    await prisma.match.delete({ where: { id: Number(id) } });

    res.json({ message: 'Partido eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar partido' });
  }
};

// --- 20. Actualizar Logística Completa (Pagos, Balón, Planilla y Cierre) ---
export const updateMatchLogistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      pagoArbitrajeLocal, 
      pagoArbitrajeVisitante, 
      llevoBalonLocal, 
      llevoBalonVisitante,
      planillaUrl,       // <--- NUEVO
      controlFinalizado  // <--- NUEVO
    } = req.body;

    // Validación: Si el partido ya tenía controlFinalizado = true, no permitir cambios
    // (Opcional, pero recomendable por seguridad)
    const currentMatch = await prisma.match.findUnique({ where: { id: Number(id) } });
    if (currentMatch?.controlFinalizado) {
       res.status(400).json({ error: 'El control post-partido ya fue finalizado y no se puede editar.' });
       return;
    }

    const updatedMatch = await prisma.match.update({
      where: { id: Number(id) },
      data: {
        pagoArbitrajeLocal,
        pagoArbitrajeVisitante,
        llevoBalonLocal,
        llevoBalonVisitante,
        planillaUrl,         // Guardamos la foto
        controlFinalizado    // Guardamos el bloqueo
      }
    });

    res.json({ message: 'Logística actualizada', match: updatedMatch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar logística' });
  }
};

// --- 21. Gestión de Usuarios (SOLO ADMIN) ---

// A) Listar todos los usuarios
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        nombre: true, 
        email: true, 
        rol: true, 
        createdAt: true 
      },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// B) Crear Nuevo Usuario (Admin u Oficial)
export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'OFICIAL' // Por defecto Oficial
      }
    });

    // No devolvemos la password por seguridad
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ message: 'Usuario creado exitosamente', user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario. Posible email duplicado.' });
  }
};

// C) Eliminar Usuario
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Evitar que el admin se borre a sí mismo (opcional, validación básica)
    // if (req.user.id === Number(id)) return res.status(400).json({error: "No puedes borrarte a ti mismo"});

    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// D) Actualizar Usuario
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, password } = req.body;

    // Preparamos los datos a actualizar
    const dataToUpdate: any = { 
      nombre, 
      email, 
      rol 
    };

    // Lógica de contraseña: Solo actualizamos si enviaron algo nuevo
    if (password && password.trim().length > 0) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: dataToUpdate
    });

    // Quitamos el hash antes de responder
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ message: 'Usuario actualizado', user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    // El código P2002 de Prisma es error de "Unique constraint" (Email repetido)
    res.status(500).json({ error: 'Error al actualizar. Verifica que el email no esté duplicado.' });
  }
};

// --- 22. Aplicar Walkover (Victoria Automática 3-0) ---
export const applyWalkover = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ganador } = req.body; // Esperamos 'LOCAL' o 'VISITANTE'

    if (ganador !== 'LOCAL' && ganador !== 'VISITANTE') {
      res.status(400).json({ error: 'Debes especificar el ganador (LOCAL o VISITANTE)' });
      return;
    }

    // Definir marcador oficial de Walkover
    const golesLocal = ganador === 'LOCAL' ? 3 : 0;
    const golesVisitante = ganador === 'VISITANTE' ? 3 : 0;
    const tipoEvento = ganador === 'LOCAL' ? 'WALKOVER_LOCAL' : 'WALKOVER_VISITANTE';

    // 1. Actualizar el partido
    const match = await prisma.match.update({
      where: { id: Number(id) },
      data: {
        golesLocal,
        golesVisitante,
        estado: 'FINALIZADO', // Finaliza inmediatamente
        tiempoJuego: 0        // El tiempo es irrelevante en WO
      }
    });

    // 2. Registrar el evento para el historial
    await prisma.matchEvent.create({
      data: {
        partidoId: Number(id),
        tipo: tipoEvento,
        minuto: 0
      }
    });

    res.json({ message: `Walkover aplicado. Ganador: ${ganador}`, match });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al aplicar Walkover' });
  }
};