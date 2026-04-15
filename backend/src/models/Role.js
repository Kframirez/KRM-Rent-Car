const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
  rol_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  descripcion: { type: DataTypes.STRING(255) },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'Roles',
  timestamps: false
});

module.exports = Role;