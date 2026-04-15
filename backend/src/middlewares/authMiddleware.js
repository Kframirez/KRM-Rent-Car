const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: "No se proporcionó un token de acceso." });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Fallo de autenticación:", error.message);
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
};
