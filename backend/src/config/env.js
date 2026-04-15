require('dotenv').config();

const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASS', 'DB_HOST', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((key) => {
  const value = process.env[key];
  return typeof value !== 'string' || value.trim() === '';
});

if (missingEnvVars.length > 0) {
  throw new Error(
    `Faltan variables de entorno obligatorias: ${missingEnvVars.join(', ')}. ` +
    'Configura backend/.env usando backend/.env.example antes de iniciar el servidor.'
  );
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT || 3306),
  jwtSecret: process.env.JWT_SECRET,
  dbSync: process.env.DB_SYNC === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || ''
};
