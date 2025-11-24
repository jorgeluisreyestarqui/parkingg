const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Configuracion = sequelize.define('Configuracion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    clave: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    valor: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(50),
        defaultValue: 'texto'
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'configuraciones',
    timestamps: true
});

module.exports = Configuracion;