const express = require('express');
const reporteController = require('../controllers/reporteController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
router.use(authMiddleware);

// 📅 REPORTES
router.get('/ingresos', reporteController.getReporteIngresos);
router.get('/ocupacion', reporteController.getReporteOcupacion);
router.get('/vehiculos', reporteController.getReporteVehiculos);

module.exports = router;