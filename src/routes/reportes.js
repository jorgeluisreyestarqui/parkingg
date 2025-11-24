const express = require('express');
const reporteController = require('../controllers/reporteController');
const { authMiddleware } = require('../middleware/auth');
const { esAdmin } = require('../middleware/roles');
const exportador = require('./exportaciones');

const router = express.Router();

// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
router.use(authMiddleware);

// 📅 REPORTES (admin)
router.get('/ingresos', esAdmin, reporteController.getReporteIngresos);
router.get('/ocupacion', esAdmin, reporteController.getReporteOcupacion);  
router.get('/vehiculos', esAdmin, reporteController.getReporteVehiculos); 

// 📥 RUTAS DE EXPORTACIÓN
router.get('/exportar/:tipo/:formato', esAdmin, async (req, res) => {
    try {
        const { tipo, formato } = req.params;
        const { fechaInicio, fechaFin, fecha } = req.query;

        console.log('📤 Solicitud de exportación:', { tipo, formato, fechaInicio, fechaFin, fecha });

        // Obtener datos del reporte usando el controlador
        let datosReporte;
        switch (tipo) {
            case 'ingresos':
                // Simular el request object para el controlador
                const reqIngresos = {
                    query: { fechaInicio, fechaFin }
                };
                const resIngresos = {
                    json: (data) => datosReporte = data
                };
                await reporteController.getReporteIngresos(reqIngresos, resIngresos);
                break;
                
            case 'ocupacion':
                const reqOcupacion = {
                    query: { fecha }
                };
                const resOcupacion = {
                    json: (data) => datosReporte = data
                };
                await reporteController.getReporteOcupacion(reqOcupacion, resOcupacion);
                break;
                
            case 'vehiculos':
                const reqVehiculos = {
                    query: { fechaInicio, fechaFin }
                };
                const resVehiculos = {
                    json: (data) => datosReporte = data
                };
                await reporteController.getReporteVehiculos(reqVehiculos, resVehiculos);
                break;
                
            default:
                return res.status(400).json({ success: false, message: 'Tipo de reporte inválido' });
        }

        console.log('📊 Datos del reporte obtenidos:', datosReporte);

        if (!datosReporte || !datosReporte.success) {
            return res.status(400).json(datosReporte || { success: false, message: 'Error al obtener datos del reporte' });
        }

        // Exportar según el formato
        if (formato === 'excel') {
            console.log('📊 Exportando a Excel...');
            await exportador.exportarExcel(datosReporte.data, tipo, res);
        } else if (formato === 'pdf') {
            console.log('📄 Exportando a PDF...');
            await exportador.exportarPDF(datosReporte.data, tipo, res);
        } else {
            res.status(400).json({ success: false, message: 'Formato de exportación inválido' });
        }

    } catch (error) {
        console.error('❌ Error en exportación:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al exportar reporte',
            error: error.message 
        });
    }
});

module.exports = router;