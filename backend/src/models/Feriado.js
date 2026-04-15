const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Feriado = sequelize.define('Feriado', {
  feriado_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Feriados',
  timestamps: false,
  freezeTableName: true
});

module.exports = Feriado;