const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bitacora = sequelize.define('Bitacora', {
  bitacora_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER },
  accion: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ip_origen: { type: DataTypes.STRING }
}, { tableName: 'Bitacora_Usuarios', timestamps: false });

module.exports = Bitacora;