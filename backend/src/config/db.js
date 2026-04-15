const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(
  env.dbName,
  env.dbUser,
  env.dbPass,
  {
    host: env.dbHost,
    port: env.dbPort,
    dialect: 'mysql',
    logging: false, 
    define: {
      timestamps: false,    
      freezeTableName: true 
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
