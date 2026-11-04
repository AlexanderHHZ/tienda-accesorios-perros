import express, { Request, Response, NextFunction } from "express";
import path from "path";
import authRoutes from "./routes/auth.routes";
import tarjetaRoutes from "./routes/tarjeta.routes";
import pagoRoutes from "./routes/pago.routes";

export const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/auth", authRoutes);
app.use("/tarjetas", tarjetaRoutes);
app.use("/pagos", pagoRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Manejador global de errores: nunca se devuelve ni se registra el cuerpo de
// la petición (podría contener datos de tarjeta), solo el mensaje del error.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err instanceof Error ? err.message : "desconocido");
  res.status(500).json({ error: "Error interno del servidor" });
});
