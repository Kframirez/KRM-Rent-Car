const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define('Usuario', {
  usuario_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nombre: { type: DataTypes.STRING },
  apellido: { type: DataTypes.STRING },
  username: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  imagen_url: { type: DataTypes.STRING, allowNull: true },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'Usuarios',
  timestamps: false,
  freezeTableName: true
});

module.exports = Usuario;