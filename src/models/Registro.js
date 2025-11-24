const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Registro = sequelize.define('Registro', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    horaEntrada: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    horaSalida: {
        type: DataTypes.DATE,
        allowNull: true
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('activo', 'finalizado'),
        defaultValue: 'activo'
    },
    espacio: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'registros'
});

module.exports = Registro;