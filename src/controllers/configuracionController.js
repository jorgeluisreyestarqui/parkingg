const { Configuracion, CampoFormulario, Tarifa, Espacio } = require('../models');

const configuracionController = {

    // 🏢 OBTENER CONFIGURACIÓN DEL SISTEMA
    async getConfiguracion(req, res) {
        try {
            const configuraciones = await Configuracion.findAll();
            
            const configObject = {};
            configuraciones.forEach(config => {
                configObject[config.clave] = {
                    valor: config.valor,
                    tipo: config.tipo,
                    descripcion: config.descripcion
                };
            });

            res.json({
                success: true,
                data: configObject
            });

        } catch (error) {
            console.error('Error obteniendo configuración:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la configuración'
            });
        }
    },

    // ⚙️ ACTUALIZAR CONFIGURACIÓN
    async updateConfiguracion(req, res) {
        try {
            const { clave, valor } = req.body;

            const [affectedRows] = await Configuracion.update(
                { valor },
                { where: { clave } }
            );

            if (affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Configuración no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Configuración actualizada correctamente'
            });

        } catch (error) {
            console.error('Error actualizando configuración:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la configuración'
            });
        }
    },

    // 📝 OBTENER CAMPOS DEL FORMULARIO
    async getCamposFormulario(req, res) {
        try {
            const campos = await CampoFormulario.findAll({
                where: { activo: true },
                order: [['orden', 'ASC']]
            });

            res.json({
                success: true,
                data: campos
            });

        } catch (error) {
            console.error('Error obteniendo campos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los campos del formulario'
            });
        }
    },

    // ➕ CREAR NUEVO CAMPO
    async createCampo(req, res) {
        try {
            const { nombre, etiqueta, tipo, obligatorio, valores_predefinidos, orden } = req.body;

            // Verificar si el campo ya existe
            const campoExistente = await CampoFormulario.findOne({ where: { nombre } });
            if (campoExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un campo con ese nombre'
                });
            }

            const nuevoCampo = await CampoFormulario.create({
                nombre,
                etiqueta,
                tipo,
                obligatorio: obligatorio || false,
                valores_predefinidos,
                orden: orden || 0
            });

            res.status(201).json({
                success: true,
                message: 'Campo creado correctamente',
                data: nuevoCampo
            });

        } catch (error) {
            console.error('Error creando campo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el campo'
            });
        }
    },

    // ✏️ ACTUALIZAR CAMPO
    async updateCampo(req, res) {
        try {
            const { id } = req.params;
            const { etiqueta, tipo, obligatorio, activo, valores_predefinidos, orden } = req.body;

            const campo = await CampoFormulario.findByPk(id);
            if (!campo) {
                return res.status(404).json({
                    success: false,
                    message: 'Campo no encontrado'
                });
            }

            await campo.update({
                etiqueta,
                tipo,
                obligatorio,
                activo,
                valores_predefinidos,
                orden
            });

            res.json({
                success: true,
                message: 'Campo actualizado correctamente',
                data: campo
            });

        } catch (error) {
            console.error('Error actualizando campo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el campo'
            });
        }
    },

    // 🗑️ ELIMINAR CAMPO (desactivar)
    async deleteCampo(req, res) {
        try {
            const { id } = req.params;

            const campo = await CampoFormulario.findByPk(id);
            if (!campo) {
                return res.status(404).json({
                    success: false,
                    message: 'Campo no encontrado'
                });
            }

            await campo.update({ activo: false });

            res.json({
                success: true,
                message: 'Campo eliminado correctamente'
            });

        } catch (error) {
            console.error('Error eliminando campo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el campo'
            });
        }
    },

    // 💰 OBTENER TARIFAS
    async getTarifas(req, res) {
        try {
            const tarifas = await Tarifa.findAll({
                where: { activa: true },
                order: [['tipo', 'ASC']]
            });

            res.json({
                success: true,
                data: tarifas
            });

        } catch (error) {
            console.error('Error obteniendo tarifas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las tarifas'
            });
        }
    },

    // 💰 ACTUALIZAR TARIFA
    async updateTarifa(req, res) {
        try {
            const { id } = req.params;
            const { precio } = req.body;

            const tarifa = await Tarifa.findByPk(id);
            if (!tarifa) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarifa no encontrada'
                });
            }

            // Crear nueva tarifa con nueva vigencia (mantener histórico)
            const nuevaTarifa = await Tarifa.create({
                tipo: tarifa.tipo,
                precio: precio,
                vigenciaDesde: new Date(),
                activa: true
            });

            // Desactivar tarifa anterior
            await tarifa.update({ activa: false });

            res.json({
                success: true,
                message: 'Tarifa actualizada correctamente',
                data: nuevaTarifa
            });

        } catch (error) {
            console.error('Error actualizando tarifa:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la tarifa'
            });
        }
    },

    // 🅿️ ACTUALIZAR ESPACIOS TOTALES
    async updateEspaciosTotales(req, res) {
        try {
            const { cantidad } = req.body;

            // Actualizar configuración de espacios
            await Configuracion.update(
                { valor: cantidad.toString() },
                { where: { clave: 'espacios_totales' } }
            );

            res.json({
                success: true,
                message: `Espacios totales actualizados a ${cantidad}`
            });

        } catch (error) {
            console.error('Error actualizando espacios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar los espacios'
            });
        }
    }

};

module.exports = configuracionController;