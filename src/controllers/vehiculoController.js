const { Vehiculo, Registro, Espacio, Tarifa, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const vehiculoController = {
  // 📥 REGISTRAR ENTRADA DE VEHÍCULO
  registrarEntrada: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { placa, marca, modelo, color } = req.body;

      // Buscar espacio disponible
      const espacio = await Espacio.findOne({ 
        where: { estado: 'disponible' } 
      });

      if (!espacio) {
        return res.status(400).json({
          success: false,
          message: 'No hay espacios disponibles en este momento'
        });
      }

      // Buscar o crear vehículo
      const [vehiculo, created] = await Vehiculo.findOrCreate({
        where: { placa },
        defaults: { marca, modelo, color }
      });

      // Si el vehículo ya existe pero los datos son diferentes, actualizar
      if (!created && (vehiculo.marca !== marca || vehiculo.modelo !== modelo || vehiculo.color !== color)) {
        await vehiculo.update({ marca, modelo, color });
      }

      // Verificar si el vehículo ya está dentro del parqueo
      const registroActivo = await Registro.findOne({
        where: { 
          vehiculoId: vehiculo.id,
          estado: 'activo'
        }
      });

      if (registroActivo) {
        return res.status(400).json({
          success: false,
          message: 'Este vehículo ya se encuentra dentro del parqueo',
          data: {
            espacio: registroActivo.espacio,
            horaEntrada: registroActivo.horaEntrada
          }
        });
      }

      // Crear registro de entrada
      const registro = await Registro.create({
        vehiculoId: vehiculo.id,
        usuarioId: req.user.id,
        espacio: espacio.numero,
        estado: 'activo'
      });

      // Actualizar estado del espacio
      await espacio.update({ estado: 'ocupado' });

      res.status(201).json({
        success: true,
        message: 'Vehículo registrado exitosamente',
        data: {
          vehiculo: {
            id: vehiculo.id,
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            color: vehiculo.color
          },
          registro: {
            id: registro.id,
            espacio: registro.espacio,
            horaEntrada: registro.horaEntrada
          }
        }
      });

    } catch (error) {
      console.error('Error registrando entrada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 📤 REGISTRAR SALIDA DE VEHÍCULO
  registrarSalida: async (req, res) => {
    try {
      const { placa } = req.body;

      // Buscar vehículo
      const vehiculo = await Vehiculo.findOne({ where: { placa } });
      
      if (!vehiculo) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      // Buscar registro activo
      const registro = await Registro.findOne({
        where: { 
          vehiculoId: vehiculo.id,
          estado: 'activo'
        }
      });

      if (!registro) {
        return res.status(400).json({
          success: false,
          message: 'Este vehículo no se encuentra dentro del parqueo'
        });
      }

      // Calcular tiempo y monto
      const horaSalida = new Date();
      const tiempoTranscurrido = horaSalida - registro.horaEntrada;
      const horas = Math.ceil(tiempoTranscurrido / (1000 * 60 * 60)); // Redondear hacia arriba

      // Obtener tarifa vigente (usar la más reciente)
      const tarifa = await Tarifa.findOne({
        where: { 
          tipo: 'hora',
          activa: true
        },
        order: [['vigenciaDesde', 'DESC']]
      });

      const monto = tarifa ? horas * tarifa.precio : horas * 5.00; // Default $5 por hora

      // Actualizar registro
      await registro.update({
        horaSalida,
        monto,
        estado: 'finalizado'
      });

      // Liberar espacio
      await Espacio.update(
        { estado: 'disponible' },
        { where: { numero: registro.espacio } }
      );

      res.json({
        success: true,
        message: 'Salida registrada exitosamente',
        data: {
          vehiculo: {
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo
          },
          registro: {
            tiempoEstancia: `${horas} horas`,
            monto: monto.toFixed(2),
            horaEntrada: registro.horaEntrada,
            horaSalida: registro.horaSalida
          }
        }
      });

    } catch (error) {
      console.error('Error registrando salida:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 📊 LISTAR VEHÍCULOS ACTIVOS (EN EL PARQUEO)
  listarActivos: async (req, res) => {
    try {
      const registrosActivos = await Registro.findAll({
        where: { estado: 'activo' },
        include: [
          {
            model: Vehiculo,
            attributes: ['id', 'placa', 'marca', 'modelo', 'color']
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['horaEntrada', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          count: registrosActivos.length,
          vehiculos: registrosActivos.map(registro => ({
            id: registro.id,
            espacio: registro.espacio,
            horaEntrada: registro.horaEntrada,
            vehiculo: registro.Vehiculo,
            registradoPor: registro.usuario
          }))
        }
      });

    } catch (error) {
      console.error('Error listando vehículos activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 🔍 BUSCAR VEHÍCULO POR PLACA
  buscarPorPlaca: async (req, res) => {
    try {
      const { placa } = req.params;

      const vehiculo = await Vehiculo.findOne({
        where: { placa },
        include: [
          {
            model: Registro,
            as: 'registros',
            include: [
              {
                model: User,
                as: 'usuario',
                attributes: ['nombre']
              }
            ],
            order: [['horaEntrada', 'DESC']]
          }
        ]
      });

      if (!vehiculo) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          vehiculo: {
            id: vehiculo.id,
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            color: vehiculo.color
          },
          historial: vehiculo.registros.map(registro => ({
            id: registro.id,
            estado: registro.estado,
            espacio: registro.espacio,
            horaEntrada: registro.horaEntrada,
            horaSalida: registro.horaSalida,
            monto: registro.monto,
            registradoPor: registro.usuario?.nombre
          }))
        }
      });

    } catch (error) {
      console.error('Error buscando vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 📈 OBTENER HISTORIAL COMPLETO
  obtenerHistorial: async (req, res) => {
    try {
      const { fecha, page = 1, limit = 10 } = req.query;
      
      let whereClause = {};
      
      if (fecha) {
        const startDate = new Date(fecha);
        const endDate = new Date(fecha);
        endDate.setDate(endDate.getDate() + 1);
        
        whereClause.horaEntrada = {
          [Op.between]: [startDate, endDate]
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows: registros } = await Registro.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Vehiculo,
            attributes: ['placa', 'marca', 'modelo', 'color']
          },
          {
            model: User,
            as: 'usuario',
            attributes: ['nombre']
          }
        ],
        order: [['horaEntrada', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          registros: registros.map(registro => ({
            id: registro.id,
            placa: registro.Vehiculo.placa,
            vehiculo: `${registro.Vehiculo.marca} ${registro.Vehiculo.modelo} (${registro.Vehiculo.color})`,
            espacio: registro.espacio,
            estado: registro.estado,
            horaEntrada: registro.horaEntrada,
            horaSalida: registro.horaSalida,
            monto: registro.monto,
            registradoPor: registro.usuario?.nombre
          }))
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = vehiculoController;