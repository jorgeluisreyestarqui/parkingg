const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.activo) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no encontrado o inactivo.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido o expirado.' 
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.' 
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};