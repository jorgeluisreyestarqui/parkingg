const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
router.use(authMiddleware);

// 📊 ESTADÍSTICAS GENERALES
router.get('/estadisticas', dashboardController.getEstadisticas);

// 📈 ESTADÍSTICAS POR FECHA (para gráficos)
router.get('/estadisticas/fecha', dashboardController.getEstadisticasPorFecha);

// 🔍 BÚSQUEDA RÁPIDA
router.get('/busqueda', dashboardController.busquedaRapida);

module.exports = router;