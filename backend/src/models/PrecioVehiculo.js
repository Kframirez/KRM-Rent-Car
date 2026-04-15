const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PrecioVehiculo = sequelize.define('Precios_Vehiculo', {
  precio_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vehiculo_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo_dia_id: { type: DataTypes.INTEGER, allowNull: false },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'Precios_Vehiculo',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['vehiculo_id', 'tipo_dia_id']
    }
  ]
});

module.exports = PrecioVehiculo;
