import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_123';

// Definimos una interfaz para que TypeScript sepa que añadimos "user" a la request
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Buscamos el token en la cabecera "Authorization"
  const authHeader = req.headers['authorization'];
  // El formato suele ser: "Bearer EYJhbGci..." así que separamos el texto
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
    return;
  }

  // 2. Verificamos si el token es real
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Token inválido o expirado' });
      return;
    }
    // 3. Si es válido, guardamos la info del usuario en la request y dejamos pasar
    req.user = user;
    next();
  });
};