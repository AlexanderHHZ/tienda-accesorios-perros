import { PrismaClient } from "@prisma/client";

// Instancia unica de PrismaClient reutilizada en toda la app
// (evita agotar conexiones a la BD en desarrollo con hot-reload).
export const prisma = new PrismaClient();
