const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vehiculo = sequelize.define('Vehiculo', {
  vehiculo_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  gama_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  marca: { type: DataTypes.STRING, allowNull: false },
  modelo: { type: DataTypes.STRING, allowNull: false },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  placa: { type: DataTypes.STRING, unique: true, allowNull: false },
  tipo: { type: DataTypes.STRING },
  imagen_url: { type: DataTypes.STRING, allowNull: true },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'Vehiculos',
  timestamps: false,
  freezeTableName: true
});

module.exports = Vehiculo;