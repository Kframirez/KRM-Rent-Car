const Cliente = require('./Cliente');
const Usuario = require('./Usuario');
const Gama = require('./Gama');
const Vehiculo = require('./Vehiculo');
const Alquiler = require('./Alquiler'); 
const AlquilerDetalle = require('./AlquilerDetalle');
const PrecioVehiculo = require('./PrecioVehiculo');
const Pago = require('./Pago'); 
const PagoDetalle = require('./PagoDetalle');
const Penalidades = require('./Penalidades');
const { Recepcion, RecepcionDetalle } = require('./Recepcion');
const Role = require('./Role'); 
const Permisos = require('./Permiso'); 
const RolPermiso = require('./RolPermiso'); 
const Feriado = require('./Feriado');


Usuario.belongsTo(Role, { foreignKey: 'rol_id' });
Role.hasMany(Usuario, { foreignKey: 'rol_id' });


Role.belongsToMany(Permisos, { 
    through: RolPermiso, 
    foreignKey: 'rol_id', 
    otherKey: 'permiso_id' 
});
Permisos.belongsToMany(Role, { 
    through: RolPermiso, 
    foreignKey: 'permiso_id', 
    otherKey: 'rol_id' 
});

Vehiculo.belongsTo(Gama, { foreignKey: 'gama_id' });
Gama.hasMany(Vehiculo, { foreignKey: 'gama_id' });
Vehiculo.hasMany(PrecioVehiculo, { foreignKey: 'vehiculo_id', as: 'ListaPrecios' });
PrecioVehiculo.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Alquiler.belongsTo(Cliente, { foreignKey: 'cliente_id' });
Cliente.hasMany(Alquiler, { foreignKey: 'cliente_id' });
Alquiler.hasMany(AlquilerDetalle, { foreignKey: 'alquiler_id', as: 'AlquilerDetalles' });
AlquilerDetalle.belongsTo(Alquiler, { foreignKey: 'alquiler_id' });
AlquilerDetalle.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Pago.belongsTo(Alquiler, { foreignKey: 'alquiler_id' });
Alquiler.hasMany(Pago, { foreignKey: 'alquiler_id' });
Pago.hasMany(PagoDetalle, { foreignKey: 'pago_id', as: 'DesglosePago' });
PagoDetalle.belongsTo(Pago, { foreignKey: 'pago_id' });
Alquiler.hasMany(Penalidades, { foreignKey: 'alquiler_id', as: 'Penalidades' });
Penalidades.belongsTo(Alquiler, { foreignKey: 'alquiler_id' });
Alquiler.hasMany(Recepcion, { foreignKey: 'alquiler_id' });
Recepcion.belongsTo(Alquiler, { foreignKey: 'alquiler_id' });
Recepcion.hasMany(RecepcionDetalle, { foreignKey: 'devolucion_id', as: 'DetallesRecepcion' });
RecepcionDetalle.belongsTo(Recepcion, { foreignKey: 'devolucion_id' });
RecepcionDetalle.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Cliente.hasMany(Alquiler, { foreignKey: 'cliente_id' });
Alquiler.belongsTo(Cliente, { foreignKey: 'cliente_id' });

module.exports = {
  Cliente, Usuario, Gama, Vehiculo, Alquiler, 
  AlquilerDetalle, Recepcion, RecepcionDetalle, 
  PrecioVehiculo, Pago, PagoDetalle, Penalidades, 
  Role, Permisos, RolPermiso, Feriado
};
