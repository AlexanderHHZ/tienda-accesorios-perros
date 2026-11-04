import { Router } from "express";
import { login, verificarRolEndpoint } from "../controllers/auth.controller";
import { verificarAutenticacion } from "../middleware/auth.middleware";
import { verificarRol } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Publico
router.post("/login", asyncHandler(login));

// Protegido: solo confirma sesion + rol (cualquier usuario autenticado)
router.get("/verificar-rol", verificarAutenticacion, asyncHandler(verificarRolEndpoint));

// Ejemplo de ruta restringida SOLO a administradores,
// mostrando como se encadena en los demas servicios (inventario, compras, etc.)
router.get(
  "/solo-admin",
  verificarAutenticacion,
  verificarRol("ADMIN"),
  (req, res) => {
    res.json({ mensaje: `Bienvenido administrador ${req.usuario?.correo}` });
  }
);

export default router;
