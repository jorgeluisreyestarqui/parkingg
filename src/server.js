// 1. 📦 IMPORTAR DEPENDENCIAS
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 2. 🔗 IMPORTAR CONFIGURACIONES Y MODELOS
const { testConnection } = require('./config/database');
const { User, Vehiculo, Espacio, Tarifa, Registro } = require('./models');

// 3. 🛣️ IMPORTAR RUTAS
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const vehiculoRoutes = require('./routes/vehiculos');
const reporteRoutes = require('./routes/reportes');

// 4. 🎪 OBTENER RUTA ABSOLUTA AL DIRECTORIO PUBLIC
const publicPath = path.join(process.cwd(), 'public');
console.log(`📁 Ruta pública: ${publicPath}`);

const initializeServer = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    // CONECTAR A MYSQL PRIMERO
    await testConnection();
    
    // INICIALIZAR DATOS DE PRUEBA
    console.log('🔄 Inicializando datos de prueba...');

    // Crear usuario administrador si no existe
    const adminExists = await User.findOne({ where: { email: 'admin@parqueito.com' } });
    if (!adminExists) {
      await User.create({
        nombre: 'Administrador Principal',
        email: 'admin@parqueito.com',
        password: 'admin123',
        rol: 'admin'
      });
      console.log('👑 Usuario administrador creado (admin@parqueito.com / admin123)');
    }

    // Crear usuario empleado de prueba si no existe
    const empleadoExists = await User.findOne({ where: { email: 'empleado@parqueito.com' } });
    if (!empleadoExists) {
      await User.create({
        nombre: 'Empleado Demo',
        email: 'empleado@parqueito.com',
        password: 'empleado123',
        rol: 'empleado'
      });
      console.log('👤 Usuario empleado creado (empleado@parqueito.com / empleado123)');
    }

    // Crear espacios de parqueo si no existen
    const espacioCount = await Espacio.count();
    if (espacioCount === 0) {
      const espacios = [];
      for (let i = 1; i <= 20; i++) {
        espacios.push({
          numero: `A${i.toString().padStart(2, '0')}`,
          estado: 'disponible',
          tipo: i === 1 ? 'discapacitado' : 'normal'
        });
      }
      await Espacio.bulkCreate(espacios);
      console.log('🅿️  20 espacios de parqueo creados');
    }

    // Crear tarifas por defecto si no existen
    const tarifaCount = await Tarifa.count();
    if (tarifaCount === 0) {
      await Tarifa.bulkCreate([
        { tipo: 'fraccion_15min', precio: 2.00 },
        { tipo: 'media_hora', precio: 3.00 },
        { tipo: 'hora', precio: 5.00 },
        { tipo: 'dia_completo', precio: 40.00 }
      ]);
      console.log('💰 Tarifas por defecto creadas');
    }

    console.log('✅ Base de datos y datos inicializados correctamente');
    
    // 5. 🏗️ AHORA SÍ CREAR LA APLICACIÓN EXPRESS
    const app = express();

    // 6. ⚙️ CONFIGURAR MIDDLEWARES
    app.use(cors());
    app.use(express.json());
    
    // 🎯 SERVIR ARCHIVOS ESTÁTICOS CON RUTA ABSOLUTA
    app.use(express.static(publicPath));
    console.log('✅ Servidor de archivos estáticos configurado');

    // 🛣️ USAR RUTAS DE API
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/vehiculos', vehiculoRoutes);
    app.use('/api/reportes', reporteRoutes);

    // 7. 📊 RUTAS DE API EXISTENTES
    app.get('/api/test', (req, res) => {
      res.json({ 
        message: '🚀 API Parqueito con MySQL funcionando!',
        timestamp: new Date().toISOString()
      });
    });

    app.get('/api/health', async (req, res) => {
      try {
        const userCount = await User.count();
        const espacioCount = await Espacio.count();
        
        res.json({
          status: 'healthy',
          database: 'connected',
          users: userCount,
          espacios: espacioCount,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          database: 'error',
          error: error.message
        });
      }
    });

    // 8. 🎯 RUTA PRINCIPAL - SERVIR EL FRONTEND
    app.get('/', (req, res) => {
      console.log('📄 Sirviendo index.html...');
      res.sendFile(path.join(publicPath, 'index.html'));
    });

    // 9. 🚨 MANEJO DE ERRORES
    app.use((err, req, res, next) => {
      console.error('Error:', err.stack);
      res.status(500).json({ message: 'Algo salió mal!' });
    });

    // 10. ❌ MANEJO DE RUTAS NO ENCONTRADAS
    app.use((req, res) => {
      console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
      res.status(404).json({ 
        message: 'Ruta no encontrada',
        path: req.url,
        method: req.method
      });
    });

    // 11. 🚀 INICIAR SERVIDOR
    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SERVIDOR INICIADO CORRECTAMENTE');
      console.log('='.repeat(60));
      console.log(`🌐 FRONTEND: http://localhost:${PORT}`);
      console.log(`🚀 BACKEND API: http://localhost:${PORT}/api`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
      console.log(`📁 Ruta pública: ${publicPath}`);
      
      console.log('\n📋 URLS PARA PROBAR:');
      console.log(`   Página principal: http://localhost:${PORT}/`);
      console.log(`   Archivo CSS: http://localhost:${PORT}/css/styles.css`);
      console.log(`   Archivo JS: http://localhost:${PORT}/js/app.js`);
      console.log(`   API Test: http://localhost:${PORT}/api/test`);
      
      
      console.log('\n📋 ENDPOINTS DE REPORTES:');
      console.log(`   GET  http://localhost:${PORT}/api/reportes/ingresos`);
      console.log(`   GET  http://localhost:${PORT}/api/reportes/ocupacion`);
      console.log(`   GET  http://localhost:${PORT}/api/reportes/vehiculos`);
      
      console.log('\n👤 CUENTAS DE DEMO:');
      console.log('   Administrador: admin@parqueito.com / admin123');
      console.log('   Empleado: empleado@parqueito.com / empleado123');
      console.log('='.repeat(60));

    });

  } catch (error) {
    console.error('❌ ERROR INICIALIZANDO SERVIDOR:');
    console.error('💡 Verifica que:');
    console.error('   1. MySQL esté ejecutándose');
    console.error('   2. Las credenciales en .env sean correctas');
    console.error('   3. La base de datos "parking" exista');
    console.error('🔧 Error detallado:', error.message);
    process.exit(1);
  }
};

// 12. 🏁 INICIAR TODO EL PROCESO
initializeServer();