const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Gama = sequelize.define('Gama', {
  gama_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  nombre: { 
    type: DataTypes.STRING(50), 
    allowNull: false, 
    unique: true 
  },
  descripcion: { 
    type: DataTypes.STRING(255),
    allowNull: true
  },
  estado: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, {
  tableName: 'Gamas',
  timestamps: false,
  freezeTableName: true
});

module.exports = Gama;