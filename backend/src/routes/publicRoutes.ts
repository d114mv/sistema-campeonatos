import { Router } from 'express';
import { getStandings, getMatches, getPlayerStats, getMatchDetail } from '../controllers/adminController';

const router = Router();

// Estas rutas NO usan "authenticateToken", cualquiera puede verlas
router.get('/posiciones', getStandings);
router.get('/partidos', getMatches);
router.get('/estadisticas', getPlayerStats);
router.get('/partidos/:id', getMatchDetail);

export default router;