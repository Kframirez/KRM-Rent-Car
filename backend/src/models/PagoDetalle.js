const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PagoDetalle = sequelize.define('PagoDetalle', {
  detalle_pago_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  pago_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo_cargo: { 
    type: DataTypes.ENUM('ALQUILER', 'PENALIDAD'), 
    allowNull: false 
  },
  referencia_id: { type: DataTypes.INTEGER, allowNull: false },
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: { 
    type: DataTypes.ENUM('ACTIVO', 'ANULADO'), 
    defaultValue: 'ACTIVO' 
  }
}, {
  tableName: 'Pago_Detalle',
  timestamps: false
});

module.exports = PagoDetalle;