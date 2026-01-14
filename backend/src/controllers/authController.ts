import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_123'; // En producción esto va en .env

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Buscar al usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    // 2. Verificar la contraseña
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    // 3. Generar el Token (El pase VIP)
    const token = jwt.sign(
      { userId: user.id, rol: user.rol }, // Guardamos ID y Rol en el token
      JWT_SECRET,
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // 4. Responder con el token y datos del usuario
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};