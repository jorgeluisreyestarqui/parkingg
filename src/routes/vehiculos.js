const express = require('express');
const { body } = require('express-validator');
const vehiculoController = require('../controllers/vehiculoController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const entradaValidation = [
    body('placa')
        .notEmpty()
        .trim()
        .isLength({ min: 3 })
        .withMessage('La placa debe tener al menos 3 caracteres'),
    body('marca')
        .notEmpty()
        .trim()
        .withMessage('La marca es requerida'),
    body('modelo')
        .notEmpty()
        .trim()
        .withMessage('El modelo es requerido'),
    body('color')
        .notEmpty()
        .trim()
        .withMessage('El color es requerido')
];

const salidaValidation = [
    body('placa')
        .notEmpty()
        .trim()
        .withMessage('La placa es requerida')
];

// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
router.use(authMiddleware);

// 🚗 RUTAS DE VEHÍCULOS
router.post('/entrada', entradaValidation, vehiculoController.registrarEntrada);
router.post('/salida', salidaValidation, vehiculoController.registrarSalida);
router.get('/activos', vehiculoController.listarActivos);
router.get('/buscar/:placa', vehiculoController.buscarPorPlaca);
router.get('/historial', vehiculoController.obtenerHistorial);

module.exports = router;