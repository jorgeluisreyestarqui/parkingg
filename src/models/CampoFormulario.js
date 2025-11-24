const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CampoFormulario = sequelize.define('CampoFormulario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    etiqueta: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('texto', 'select', 'numero', 'color', 'fecha'),
        defaultValue: 'texto'
    },
    obligatorio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    valores_predefinidos: {
        type: DataTypes.JSON,
        allowNull: true
    },
    orden: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'campos_formulario',
    timestamps: true
});

module.exports = CampoFormulario;