const { Vehiculo, Registro, Espacio, Tarifa, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

const dashboardController = {
  // 📊 ESTADÍSTICAS GENERALES EN TIEMPO REAL - VERSIÓN CORREGIDA
  getEstadisticas: async (req, res) => {
    try {
      console.log('🔍 INICIANDO CONSULTA DE ESTADÍSTICAS...');

      // 1. PRIMERO: Contar espacios de manera simple
      console.log('1. Contando espacios...');
      const totalEspacios = await Espacio.count();
      const espaciosDisponibles = await Espacio.count({ where: { estado: 'disponible' } });
      const espaciosOcupados = await Espacio.count({ where: { estado: 'ocupado' } });
      const espaciosMantenimiento = await Espacio.count({ where: { estado: 'mantenimiento' } });
      
      console.log('📊 Espacios - Total:', totalEspacios, 'Disponibles:', espaciosDisponibles, 'Ocupados:', espaciosOcupados, 'Mantenimiento:', espaciosMantenimiento);

      // 2. Contar vehículos activos
      console.log('2. Contando vehículos activos...');
      const vehiculosActivos = await Registro.count({
        where: { estado: 'activo' }
      });
      console.log('🚗 Vehículos activos:', vehiculosActivos);

      // 3. Ingresos del día (versión mejorada)
      console.log('3. Calculando ingresos...');
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const ingresosHoy = await Registro.sum('monto', {
        where: {
          horaSalida: {
            [Op.between]: [inicioDia, finDia]
          },
          estado: 'finalizado'
        }
      });
      console.log('💰 Ingresos hoy:', ingresosHoy);

      // 4. Registros de hoy
      console.log('4. Contando registros de hoy...');
      const registrosHoy = await Registro.count({
        where: {
          horaEntrada: {
            [Op.between]: [inicioDia, finDia]
          }
        }
      });
      console.log('📝 Registros hoy:', registrosHoy);

      // 5. Últimos registros activos (CORREGIDO con alias)
      console.log('5. Obteniendo últimos registros...');
      const ultimosRegistros = await Registro.findAll({
        where: {
          estado: 'activo'
        },
        include: [
          {
            model: Vehiculo,
            as: 'vehiculo', // ✅ ALIAS CORRECTO
            attributes: ['placa', 'marca', 'modelo', 'color']
          },
          {
            model: User,
            as: 'usuario', // ✅ ALIAS CORRECTO
            attributes: ['nombre'],
            required: false
          }
        ],
        order: [['horaEntrada', 'DESC']],
        limit: 5
      });
      console.log('📋 Últimos registros encontrados:', ultimosRegistros.length);

      // 6. Vehículos frecuentes (CORREGIDO con alias)
      console.log('6. Buscando vehículos frecuentes...');
      const vehiculosFrecuentesData = await Registro.findAll({
        attributes: [
          'vehiculoId',
          [Sequelize.fn('COUNT', Sequelize.col('vehiculoId')), 'visitas']
        ],
        include: [{
          model: Vehiculo,
          as: 'vehiculo', // ✅ ALIAS CORRECTO
          attributes: ['placa', 'marca', 'modelo']
        }],
        group: ['vehiculoId'],
        order: [[Sequelize.literal('visitas'), 'DESC']],
        limit: 5
      });
      console.log('🏆 Vehículos frecuentes:', vehiculosFrecuentesData.length);

      // FORMATEAR RESPUESTA
      const response = {
        success: true,
        data: {
          metricas: {
            espacios: {
              total: totalEspacios,
              disponibles: espaciosDisponibles,
              ocupados: espaciosOcupados,
              mantenimiento: espaciosMantenimiento
            },
            vehiculosActivos: vehiculosActivos,
            ingresosHoy: parseFloat(ingresosHoy) || 0,
            registrosHoy: registrosHoy,
            ocupacion: totalEspacios > 0 ? ((espaciosOcupados / totalEspacios) * 100).toFixed(1) : 0
          },
          vehiculosFrecuentes: vehiculosFrecuentesData.map(v => ({
            placa: v.vehiculo.placa,
            vehiculo: `${v.vehiculo.marca} ${v.vehiculo.modelo}`,
            visitas: parseInt(v.dataValues.visitas)
          })),
          ultimosRegistros: ultimosRegistros.map(registro => ({
            id: registro.id,
            placa: registro.vehiculo.placa,
            vehiculo: `${registro.vehiculo.marca} ${registro.vehiculo.modelo}`,
            color: registro.vehiculo.color,
            espacio: registro.espacio,
            estado: registro.estado,
            horaEntrada: registro.horaEntrada,
            registradoPor: registro.usuario ? registro.usuario.nombre : 'Sistema'
          }))
        }
      };

      console.log('✅ ESTADÍSTICAS GENERADAS EXITOSAMENTE');
      console.log('📊 RESULTADO:', JSON.stringify(response.data.metricas, null, 2));

      res.json(response);

    } catch (error) {
      console.error('❌ ERROR CRÍTICO EN DASHBOARD:', error);
      console.error('🔍 Stack trace completo:', error.stack);
      
      // Enviar error detallado en desarrollo
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // 📈 ESTADÍSTICAS POR FECHA (versión simple)
  getEstadisticasPorFecha: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          fecha: new Date().toISOString().split('T')[0],
          entradasPorHora: [],
          ingresosPorHora: []
        }
      });
    } catch (error) {
      console.error('Error en estadísticas por fecha:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // 🔍 BÚSQUEDA RÁPIDA (versión simple)
  busquedaRapida: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: { resultados: [] }
        });
      }

      // Buscar vehículos por placa
      const vehiculos = await Vehiculo.findAll({
        where: {
          placa: {
            [Op.like]: `%${query}%`
          }
        },
        limit: 10
      });

      const resultados = vehiculos.map(vehiculo => ({
        tipo: 'vehiculo',
        id: vehiculo.id,
        placa: vehiculo.placa,
        descripcion: `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.color}`,
        estaEnParqueo: false // Por ahora siempre false
      }));

      res.json({
        success: true,
        data: { resultados }
      });

    } catch (error) {
      console.error('Error en búsqueda rápida:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = dashboardController;