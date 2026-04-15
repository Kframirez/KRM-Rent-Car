const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pago = sequelize.define('Pago', {
  pago_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  alquiler_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  usuario_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  fecha_pago: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  metodo_pago: { 
    type: DataTypes.ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA'),
    allowNull: false
  },
  total_recibo: { 
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00 
  },
  estado: { 
    type: DataTypes.ENUM('REGISTRADO', 'ANULADO'),
    defaultValue: 'REGISTRADO' 
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Pagos',
  timestamps: false
});

module.exports = Pago;
