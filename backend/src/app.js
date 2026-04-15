const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');
const env = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const gamaRoutes = require('./routes/gamaRoutes');
const feriadoRoutes = require('./routes/feriadoRoutes');
const alquilerRoutes = require('./routes/alquilerRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const disponibilidadRoutes = require('./routes/disponibilidadRoutes');
const devolucionRoutes = require('./routes/devolucionRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/gamas', gamaRoutes);
app.use('/api/feriados', feriadoRoutes);
app.use('/api/alquileres', alquilerRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/devoluciones', devolucionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

sequelize.authenticate()
  .then(() => {
    console.log('Conexion a MySQL exitosa (krm_rent_car)');

    if (env.dbSync) {
      console.log('Sincronizando modelos con la base de datos...');
      return sequelize.sync();
    }

    console.log('Sincronizacion automatica desactivada (DB_SYNC=false).');
    return null;
  })
  .then(() => {
    app.listen(env.port, () => console.log(`Servidor KRM en puerto: ${env.port}`));
  })
  .catch((err) => console.error('Error critico:', err));
