const { Vehiculo, Registro, Espacio, Tarifa, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

const reporteController = {
  // 📅 REPORTE DE INGRESOS POR FECHA
  getReporteIngresos: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, tipo = 'diario' } = req.query;
      
      console.log('📊 Generando reporte de ingresos:', { fechaInicio, fechaFin, tipo });

      // Determinar rango de fechas
      let inicio, fin;
      
      if (fechaInicio && fechaFin) {
        // Rango personalizado
        inicio = new Date(fechaInicio);
        fin = new Date(fechaFin);
        fin.setDate(fin.getDate() + 1); // Incluir el día final
      } else {
        // Por defecto: último mes
        fin = new Date();
        inicio = new Date();
        inicio.setMonth(inicio.getMonth() - 1);
      }

      console.log('📅 Rango de fechas:', inicio.toISOString(), 'a', fin.toISOString());

      // Obtener ingresos agrupados por día
      const ingresosPorDia = await Registro.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('horaSalida')), 'fecha'],
          [Sequelize.fn('SUM', Sequelize.col('monto')), 'ingresos'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'salidas']
        ],
        where: {
          horaSalida: {
            [Op.between]: [inicio, fin]
          },
          estado: 'finalizado',
          monto: {
            [Op.not]: null
          }
        },
        group: [Sequelize.fn('DATE', Sequelize.col('horaSalida'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('horaSalida')), 'ASC']],
        raw: true
      });

      console.log('💰 Ingresos por día encontrados:', ingresosPorDia.length);

      // Estadísticas generales del período
      const estadisticasPeriodo = await Registro.findOne({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('monto')), 'ingresosTotales'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalSalidas'],
          [Sequelize.fn('AVG', Sequelize.col('monto')), 'promedioPorSalida']
        ],
        where: {
          horaSalida: {
            [Op.between]: [inicio, fin]
          },
          estado: 'finalizado',
          monto: {
            [Op.not]: null
          }
        },
        raw: true
      });

      console.log('📈 Estadísticas del período:', estadisticasPeriodo);

      // Vehículos más frecuentes en el período
      const vehiculosFrecuentes = await Registro.findAll({
        attributes: [
          'vehiculoId',
          [Sequelize.fn('COUNT', Sequelize.col('vehiculoId')), 'visitas'],
          [Sequelize.fn('SUM', Sequelize.col('monto')), 'totalGastado']
        ],
        include: [{
          model: Vehiculo,
          as: 'vehiculo',
          attributes: ['placa', 'marca', 'modelo']
        }],
        where: {
          horaSalida: {
            [Op.between]: [inicio, fin]
          },
          estado: 'finalizado'
        },
        group: ['vehiculoId'],
        order: [[Sequelize.literal('visitas'), 'DESC']],
        limit: 10
      });

      console.log('🚗 Vehículos frecuentes:', vehiculosFrecuentes.length);

      // Horas pico de entrada
      const horasPico = await Registro.findAll({
        attributes: [
          [Sequelize.fn('HOUR', Sequelize.col('horaEntrada')), 'hora'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'entradas']
        ],
        where: {
          horaEntrada: {
            [Op.between]: [inicio, fin]
          }
        },
        group: [Sequelize.fn('HOUR', Sequelize.col('horaEntrada'))],
        order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
        limit: 5,
        raw: true
      });

      console.log('🕒 Horas pico:', horasPico);

      // Formatear respuesta
      const response = {
        success: true,
        data: {
          periodo: {
            fechaInicio: inicio.toISOString().split('T')[0],
            fechaFin: fin.toISOString().split('T')[0],
            dias: ingresosPorDia.length
          },
          estadisticas: {
            ingresosTotales: parseFloat(estadisticasPeriodo.ingresosTotales) || 0,
            totalSalidas: parseInt(estadisticasPeriodo.totalSalidas) || 0,
            promedioPorSalida: parseFloat(estadisticasPeriodo.promedioPorSalida) || 0,
            mejorDia: ingresosPorDia.length > 0 ? 
              ingresosPorDia.reduce((max, dia) => 
                parseFloat(dia.ingresos) > parseFloat(max.ingresos) ? dia : max
              ) : null
          },
          ingresosPorDia: ingresosPorDia.map(dia => ({
            fecha: dia.fecha,
            ingresos: parseFloat(dia.ingresos) || 0,
            salidas: parseInt(dia.salidas) || 0
          })),
          vehiculosFrecuentes: vehiculosFrecuentes.map(v => ({
            placa: v.vehiculo.placa,
            vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
            visitas: parseInt(v.dataValues.visitas),
            totalGastado: parseFloat(v.dataValues.totalGastado) || 0
          })),
          horasPico: horasPico.map(hora => ({
            hora: `${hora.hora}:00`,
            entradas: parseInt(hora.entradas)
          }))
        }
      };

      console.log('✅ Reporte de ingresos generado exitosamente');
      res.json(response);

    } catch (error) {
      console.error('❌ Error generando reporte de ingresos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al generar reporte',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  },

  // 📈 REPORTE DE OCUPACIÓN
  getReporteOcupacion: async (req, res) => {
    try {
      const { fecha } = req.query;
      const fechaConsulta = fecha ? new Date(fecha) : new Date();

      const inicioDia = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth(), fechaConsulta.getDate());
      const finDia = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth(), fechaConsulta.getDate() + 1);

      // Ocupación por hora
      const ocupacionPorHora = await Registro.findAll({
        attributes: [
          [Sequelize.fn('HOUR', Sequelize.col('horaEntrada')), 'hora'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'entradas'],
          [Sequelize.fn('AVG', Sequelize.fn('TIMESTAMPDIFF', Sequelize.literal('MINUTE'), Sequelize.col('horaEntrada'), Sequelize.col('horaSalida'))), 'tiempoPromedio']
        ],
        where: {
          horaEntrada: {
            [Op.between]: [inicioDia, finDia]
          },
          estado: 'finalizado'
        },
        group: [Sequelize.fn('HOUR', Sequelize.col('horaEntrada'))],
        order: [[Sequelize.fn('HOUR', Sequelize.col('horaEntrada')), 'ASC']],
        raw: true
      });

      // Espacios más utilizados
      const espaciosUtilizados = await Registro.findAll({
        attributes: [
          'espacio',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'uso']
        ],
        where: {
          horaEntrada: {
            [Op.between]: [inicioDia, finDia]
          }
        },
        group: ['espacio'],
        order: [[Sequelize.literal('uso'), 'DESC']],
        limit: 10,
        raw: true
      });

      res.json({
        success: true,
        data: {
          fecha: fechaConsulta.toISOString().split('T')[0],
          ocupacionPorHora: ocupacionPorHora.map(hora => ({
            hora: `${hora.hora}:00`,
            entradas: parseInt(hora.entradas) || 0,
            tiempoPromedio: parseFloat(hora.tiempoPromedio) || 0
          })),
          espaciosUtilizados: espaciosUtilizados.map(espacio => ({
            espacio: espacio.espacio,
            uso: parseInt(espacio.uso)
          }))
        }
      });

    } catch (error) {
      console.error('Error generando reporte de ocupación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 🚗 REPORTE DE VEHÍCULOS
  getReporteVehiculos: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      let inicio, fin;
      
      if (fechaInicio && fechaFin) {
        inicio = new Date(fechaInicio);
        fin = new Date(fechaFin);
        fin.setDate(fin.getDate() + 1);
      } else {
        // Últimos 30 días por defecto
        fin = new Date();
        inicio = new Date();
        inicio.setDate(inicio.getDate() - 30);
      }

      // Vehículos con más visitas
      const vehiculosTop = await Registro.findAll({
        attributes: [
          'vehiculoId',
          [Sequelize.fn('COUNT', Sequelize.col('vehiculoId')), 'totalVisitas'],
          [Sequelize.fn('SUM', Sequelize.col('monto')), 'totalGastado'],
          [Sequelize.fn('AVG', Sequelize.fn('TIMESTAMPDIFF', Sequelize.literal('MINUTE'), Sequelize.col('horaEntrada'), Sequelize.col('horaSalida'))), 'tiempoPromedio']
        ],
        include: [{
          model: Vehiculo,
          as: 'vehiculo',
          attributes: ['placa', 'marca', 'modelo', 'color']
        }],
        where: {
          horaEntrada: {
            [Op.between]: [inicio, fin]
          },
          estado: 'finalizado'
        },
        group: ['vehiculoId'],
        order: [[Sequelize.literal('totalVisitas'), 'DESC']],
        limit: 20
      });

      // Marcas más comunes
      const marcasComunes = await Vehiculo.findAll({
        attributes: [
          'marca',
          [Sequelize.fn('COUNT', Sequelize.col('marca')), 'cantidad']
        ],
        group: ['marca'],
        order: [[Sequelize.literal('cantidad'), 'DESC']],
        limit: 10,
        raw: true
      });

      res.json({
        success: true,
        data: {
          periodo: {
            fechaInicio: inicio.toISOString().split('T')[0],
            fechaFin: fin.toISOString().split('T')[0]
          },
          vehiculosTop: vehiculosTop.map(v => ({
            placa: v.vehiculo.placa,
            vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
            color: v.vehiculo.color,
            visitas: parseInt(v.dataValues.totalVisitas),
            totalGastado: parseFloat(v.dataValues.totalGastado) || 0,
            tiempoPromedio: parseFloat(v.dataValues.tiempoPromedio) || 0
          })),
          marcasComunes: marcasComunes.map(marca => ({
            marca: marca.marca,
            cantidad: parseInt(marca.cantidad)
          }))
        }
      });

    } catch (error) {
      console.error('Error generando reporte de vehículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = reporteController;