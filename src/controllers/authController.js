const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

const authController = {
  // 🔐 LOGIN DE USUARIO
  login: async (req, res) => {
    try {
      // Validar campos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await user.validPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar si está activo
      if (!user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo. Contacte al administrador.'
        });
      }

      // Generar token
      const token = generateToken(user);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 👤 OBTENER PERFIL DEL USUARIO ACTUAL
  getProfile: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            rol: req.user.rol
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 📝 REGISTRAR NUEVO USUARIO (SOLO ADMIN)
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { nombre, email, password, rol } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Crear usuario
      const user = await User.create({
        nombre,
        email,
        password,
        rol: rol || 'empleado'
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        }
      });

    } catch (error) {
      console.error('Error registrando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = authController;