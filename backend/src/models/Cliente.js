const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cliente = sequelize.define('Cliente', {
  cliente_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  cedula: { type: DataTypes.STRING, unique: true, allowNull: false },
  telefono: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  direccion: { type: DataTypes.STRING },
  imagen_url: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  estado: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, {
  tableName: 'Clientes',
  timestamps: false,
  freezeTableName: true
});

module.exports = Cliente;