const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const registerValidation = [
  body('nombre')
    .notEmpty()
    .trim()
    .withMessage('El nombre es requerido'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .optional()
    .isIn(['admin', 'empleado'])
    .withMessage('El rol debe ser admin o empleado')
];

// 🔐 RUTAS PÚBLICAS
router.post('/login', loginValidation, authController.login);

// 🔒 RUTAS PROTEGIDAS
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/register', authMiddleware, adminMiddleware, registerValidation, authController.register);

module.exports = router;