import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- 1. Crear Usuario ADMIN ---
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@emi.edu.bo' },
    update: {},
    create: {
      email: 'admin@emi.edu.bo',
      password: passwordHash,
      nombre: 'Organizador Principal',
      rol: 'ADMIN',
    },
  });
  console.log('✅ Usuario Admin listo:', admin.email);

  // --- 2. Crear Usuario OFICIAL DE MESA ---
  const passwordOficial = await bcrypt.hash('mesa123', 10);
  
  const oficial = await prisma.user.upsert({
    where: { email: 'mesa@emi.edu.bo' },
    update: {},
    create: {
      email: 'mesa@emi.edu.bo',
      password: passwordOficial,
      nombre: 'Oficial de Turno',
      rol: 'OFICIAL',
    },
  });
  console.log('✅ Usuario Oficial listo:', oficial.email);

  // --- 3. Crear Carrera (Ingeniería de Sistemas) ---
  // Usamos 'career' (inglés) porque así está en tu schema.prisma
  const nombreCarrera = 'Ingeniería de Sistemas';
  
  // Verificamos si existe primero para evitar errores si no tienes @unique
  const existeCarrera = await prisma.career.findFirst({
    where: { nombre: nombreCarrera }
  });

  if (!existeCarrera) {
    const nuevaCarrera = await prisma.career.create({
      data: {
        nombre: nombreCarrera,
      },
    });
    console.log('✅ Carrera creada:', nuevaCarrera.nombre);
  } else {
    console.log('ℹ️ La carrera ya existía:', nombreCarrera);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });