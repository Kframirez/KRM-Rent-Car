const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RolPermiso = sequelize.define('RolPermiso', {
  rol_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Roles', key: 'rol_id' }
  },
  permiso_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Permisos', key: 'permiso_id' }
  }
}, {
  tableName: 'Rol_Permisos',
  timestamps: false
});

module.exports = RolPermiso;