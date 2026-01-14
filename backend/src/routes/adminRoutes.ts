import { Router } from 'express';
import { 
  createChampionship, 
  createTeam, 
  getCarreras,
  createPlayer,
  createMatchday,
  createMatch,
  getTeams,
  getMatches,
  getMatchdays,
  getMatchDetail,
  addMatchEvent,
  updateMatchStatus,
  getStandings,
  updateTeam,
  deleteTeam,
  getPlayersByTeam,
  deletePlayer,
  deleteMatch,
  applyWalkover
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/authMiddleware';
import { updateMatchLogistics } from '../controllers/adminController';
import { getUsers, registerUser, updateUser, deleteUser } from '../controllers/adminController';

const router = Router();

// Todas las rutas aquí abajo requieren Token
router.use(authenticateToken);

// Rutas POST
router.post('/campeonatos', createChampionship);
router.post('/equipos', createTeam);
router.post('/jugadores', createPlayer);
router.post('/jornadas', createMatchday);
router.post('/partidos', createMatch);
router.post('/eventos', addMatchEvent);
router.post('/jugadores', createPlayer);
router.post('/usuarios', registerUser);

// Rutas GET
router.get('/carreras', getCarreras);
router.get('/equipos', getTeams);
router.get('/partidos', getMatches);
router.get('/jornadas', getMatchdays);
router.get('/partidos/:id', getMatchDetail);
router.get('/posiciones', getStandings);
router.get('/equipos/:teamId/jugadores', getPlayersByTeam);
router.get('/usuarios', getUsers);

// Rutas PATCH
router.patch('/partidos/:id/estado', updateMatchStatus);
router.patch('/partidos/:id/logistica', updateMatchLogistics);
router.patch('/partidos/:id/walkover', applyWalkover);

// Rutas PUT
router.put('/equipos/:id', updateTeam);
router.put('/usuarios/:id', updateUser);

// Rutas DELETE
router.delete('/equipos/:id', deleteTeam);
router.delete('/jugadores/:id', deletePlayer);
router.delete('/partidos/:id', deleteMatch);
router.delete('/usuarios/:id', deleteUser);

export default router;