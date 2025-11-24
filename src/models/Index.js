const User = require('./User');
const Vehiculo = require('./Vehiculo');
const Registro = require('./Registro');
const Espacio = require('./Espacio');
const Tarifa = require('./Tarifa');

// Relaciones
User.hasMany(Registro, { foreignKey: 'usuarioId', as: 'registros' });
Registro.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

Vehiculo.hasMany(Registro, { foreignKey: 'vehiculoId', as: 'registros' });
Registro.belongsTo(Vehiculo, { foreignKey: 'vehiculoId', as: 'vehiculo' });

// No es necesario relación directa con Espacio ya que es string simple

module.exports = {
    User,
    Vehiculo,
    Registro,
    Espacio,
    Tarifa
};