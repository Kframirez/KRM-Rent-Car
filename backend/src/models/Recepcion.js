const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Recepcion = sequelize.define('Recepcion', {
  devolucion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  alquiler_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha_devolucion: { type: DataTypes.DATEONLY, allowNull: false },
  observaciones: { type: DataTypes.STRING(255) },
  estado: { type: DataTypes.ENUM('REGISTRADA', 'ANULADA'), defaultValue: 'REGISTRADA' },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'Devoluciones', timestamps: false });

const RecepcionDetalle = sequelize.define('RecepcionDetalle', {
  detalle_devolucion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  devolucion_id: { type: DataTypes.INTEGER, allowNull: false },
  vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
  combustible_devuelto: { type: DataTypes.DECIMAL(10, 2) },
  kilometraje_devuelto: { type: DataTypes.INTEGER },
  danos: { type: DataTypes.STRING(255) },
  cargo_extra: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  estado: { type: DataTypes.ENUM('ACTIVO', 'ANULADO'), defaultValue: 'ACTIVO' }
}, { tableName: 'Devolucion_Detalle', timestamps: false });

module.exports = { Recepcion, RecepcionDetalle };
