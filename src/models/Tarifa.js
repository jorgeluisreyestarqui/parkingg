const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tarifa = sequelize.define('Tarifa', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    vigenciaDesde: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    vigenciaHasta: {
        type: DataTypes.DATE,
        allowNull: true
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tarifas'
});

module.exports = Tarifa;