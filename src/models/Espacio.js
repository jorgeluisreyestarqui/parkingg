const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Espacio = sequelize.define('Espacio', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numero: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    estado: {
        type: DataTypes.ENUM('disponible', 'ocupado', 'mantenimiento'),
        defaultValue: 'disponible'
    },
    tipo: {
        type: DataTypes.ENUM('normal', 'discapacitado', 'preferencial'),
        defaultValue: 'normal'
    }
}, {
    tableName: 'espacios'
});

module.exports = Espacio;