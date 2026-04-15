const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Penalidades = sequelize.define('Penalidades', {
  penalidad_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  alquiler_id: { type: DataTypes.INTEGER, allowNull: false },
  vehiculo_id: { type: DataTypes.INTEGER, allowNull: true },
  tipo: { type: DataTypes.ENUM('RETRASO', 'DANO', 'COMBUSTIBLE', 'OTRO'), allowNull: false },
  descripcion: { type: DataTypes.STRING(255), allowNull: false },
  dias_retraso: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_registro: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'PAGADA', 'ANULADA'), defaultValue: 'PENDIENTE' }
}, {
  tableName: 'Penalidades',
  timestamps: false
});

module.exports = Penalidades;
