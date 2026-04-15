const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RecepcionDetalle = sequelize.define('RecepcionDetalle', {
  detalle_recepcion_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recepcion_id: { type: DataTypes.INTEGER, allowNull: false },
  vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
  combustible_devuelto: { type: DataTypes.DECIMAL(5, 2) },
  kilometraje_devuelto: { type: DataTypes.INTEGER },
  danos: { type: DataTypes.STRING(100) },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'Recepcion_Detalle',
  timestamps: false
});

module.exports = RecepcionDetalle;

