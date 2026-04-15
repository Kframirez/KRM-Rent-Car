const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Alquiler = sequelize.define('Alquiler', {
  alquiler_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  cliente_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha_alquiler: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  monto_total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  observacion: { type: DataTypes.STRING(255), allowNull: true },
  estado: { 
    type: DataTypes.ENUM('PENDIENTE', 'ACTIVO', 'FINALIZADO', 'CANCELADO'), 
    defaultValue: 'PENDIENTE'
  },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'Alquileres',
  timestamps: false
});

module.exports = Alquiler;
