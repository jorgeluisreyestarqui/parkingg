const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Función para probar conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a MySQL correctamente');

        // Sincronizar modelos (crear tablas si no existen)
        await sequelize.sync({ alter: true });
        console.log('✅ Tablas sincronizadas');

    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
    }
};

module.exports = { sequelize, testConnection };