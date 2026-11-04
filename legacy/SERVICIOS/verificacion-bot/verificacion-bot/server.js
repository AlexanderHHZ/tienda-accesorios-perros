const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

const SECRET = process.env.HUMAN_CHECK_SECRET || 'clave-secreta-cambiala';

// Rate limiting: solo memoria del proceso, no requiere BD
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { verificado: false, mensaje: 'Demasiadas solicitudes, intenta más tarde' }
});
app.use('/api/verify', limiter);

// Firma un payload (timestamp + ip) firma el token.
function firmar(payload) {
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${hmac}`).toString('base64');
}

// Verifica que el token no fue alterado
function verificarFirma(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [payload, hmac] = decoded.split('.');
    const hmacEsperado = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (hmac !== hmacEsperado) return null;
    return payload; // "timestamp-ip"
  } catch {
    return null;
  }
}

// 1. Challenge: se llama cuando carga la página de login
app.get('/api/verify/challenge', (req, res) => {
  const timestamp = Date.now();
  const payload = `${timestamp}-${req.ip}`;
  const token = firmar(payload);
  res.json({ token });
});

// 2. Check: se llama al enviar el formulario de login
app.post('/api/verify/check', (req, res) => {
  const { token, honeypot } = req.body;

  // Honeypot lleno = bot
  if (honeypot && honeypot.trim() !== '') {
    return res.json({ verificado: false, mensaje: 'Actividad sospechosa detectada' });
  }

  const payload = verificarFirma(token);
  if (!payload) {
    return res.json({ verificado: false, mensaje: 'Token inválido o alterado' });
  }

  const [timestampStr, ip] = payload.split('-');
  const timestamp = parseInt(timestampStr, 10);

  if (ip !== req.ip) {
    return res.json({ verificado: false, mensaje: 'La IP no coincide con la solicitud original' });
  }

  const transcurrido = Date.now() - timestamp;

  if (transcurrido < 1500) {
    return res.json({ verificado: false, mensaje: 'Envío demasiado rápido, posible bot' });
  }
  if (transcurrido > 5 * 60 * 1000) {
    return res.json({ verificado: false, mensaje: 'La verificación expiró, recarga la página' });
  }

  const ua = req.headers['user-agent'] || '';
  if (!ua || /bot|crawler|curl|python-requests|wget|scrapy/i.test(ua)) {
    return res.json({ verificado: false, mensaje: 'User-Agent sospechoso' });
  }

  // Todo correcto
  res.json({ verificado: true, mensaje: 'Usuario verificado correctamente' });
});

app.listen(3000, () => console.log('API de verificación corriendo en puerto 3000'));