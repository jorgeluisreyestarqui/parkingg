const { User } = require('../models');

const autorizar = (rolesPermitidos = []) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'No autenticado' 
                });
            }

            // Obtener usuario completo desde la base de datos
            const usuario = await User.findByPk(req.user.id);
            if (!usuario) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Usuario no encontrado' 
                });
            }

            // Verificar si el rol está permitido
            if (!rolesPermitidos.includes(usuario.rol)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tiene permisos para realizar esta acción' 
                });
            }

            // Agregar usuario completo al request
            req.userCompleto = usuario;
            next();

        } catch (error) {
            console.error('Error en middleware de autorización:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error de autorización' 
            });
        }
    };
};

// Middlewares específicos por rol
const esAdmin = autorizar(['admin']);
const esEmpleado = autorizar(['empleado']);
const esAdminOEmpleado = autorizar(['admin', 'empleado']);

module.exports = {
    autorizar,
    esAdmin,
    esEmpleado,
    esAdminOEmpleado
};