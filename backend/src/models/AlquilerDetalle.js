const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AlquilerDetalle = sequelize.define('AlquilerDetalle', {
  detalle_alquiler_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  alquiler_id: { type: DataTypes.INTEGER, allowNull: false },
  vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
  precio_dia: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cantidad_dias: { type: DataTypes.INTEGER, allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: { 
    type: DataTypes.ENUM('ACTIVO', 'DEVUELTO', 'CANCELADO'), 
    defaultValue: 'ACTIVO' 
  }
}, {
  tableName: 'Alquiler_Detalle',
  timestamps: false
});

module.exports = AlquilerDetalle;
