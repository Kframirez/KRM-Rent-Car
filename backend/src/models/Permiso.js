const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Permisos = sequelize.define('Permisos', {
  permiso_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  modulo: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'Permisos',
  timestamps: false
});

module.exports = Permisos;