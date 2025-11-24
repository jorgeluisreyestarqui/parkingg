
const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const { esAdmin } = require('../middleware/roles');
const { authMiddleware } = require('../middleware/auth');

// 🔒 TODAS LAS RUTAS REQUIEREN SER ADMIN
router.use(authMiddleware);
router.use(esAdmin);

// 🏢 CONFIGURACIÓN DEL SISTEMA
router.get('/sistema', configuracionController.getConfiguracion);
router.put('/sistema', configuracionController.updateConfiguracion);

// 🅿️ ESPACIOS
router.put('/espacios', configuracionController.updateEspaciosTotales);

// 📝 CAMPOS DEL FORMULARIO
router.get('/campos', configuracionController.getCamposFormulario);
router.post('/campos', configuracionController.createCampo);
router.put('/campos/:id', configuracionController.updateCampo);
router.delete('/campos/:id', configuracionController.deleteCampo);

// 💰 TARIFAS
router.get('/tarifas', configuracionController.getTarifas);
router.put('/tarifas/:id', configuracionController.updateTarifa);

module.exports = router;