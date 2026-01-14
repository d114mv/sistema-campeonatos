import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// Definir la ruta POST http://localhost:3000/api/auth/login
router.post('/login', login);

export default router;