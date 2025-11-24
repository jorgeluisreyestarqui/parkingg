const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ExportadorReportes {
    
    // 📊 EXPORTAR A EXCEL
    async exportarExcel(data, tipoReporte, res) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte');

            // Configurar columnas según el tipo de reporte
            this.configurarColumnasExcel(worksheet, tipoReporte);
            
            // Agregar datos
            await this.agregarDatosExcel(worksheet, data, tipoReporte);
            
            // Configurar respuesta
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-${tipoReporte}-${Date.now()}.xlsx"`);
            
            await workbook.xlsx.write(res);
            res.end();
            
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            res.status(500).json({ success: false, message: 'Error al exportar a Excel' });
        }
    }

    // 📄 EXPORTAR A PDF
    async exportarPDF(data, tipoReporte, res) {
        try {
            const doc = new PDFDocument();
            
            // Configurar respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-${tipoReporte}-${Date.now()}.pdf"`);
            
            doc.pipe(res);
            
            // Agregar contenido al PDF
            await this.agregarContenidoPDF(doc, data, tipoReporte);
            
            doc.end();
            
        } catch (error) {
            console.error('Error exportando a PDF:', error);
            res.status(500).json({ success: false, message: 'Error al exportar a PDF' });
        }
    }

    // ⚙️ CONFIGURAR COLUMNAS EXCEL
    configurarColumnasExcel(worksheet, tipoReporte) {
        switch (tipoReporte) {
            case 'ingresos':
                worksheet.columns = [
                    { header: 'Fecha', key: 'fecha', width: 15 },
                    { header: 'Ingresos', key: 'ingresos', width: 15 },
                    { header: 'Salidas', key: 'salidas', width: 12 },
                    { header: 'Promedio por Salida', key: 'promedio', width: 20 }
                ];
                break;
                
            case 'ocupacion':
                worksheet.columns = [
                    { header: 'Hora', key: 'hora', width: 10 },
                    { header: 'Entradas', key: 'entradas', width: 12 },
                    { header: 'Tiempo Promedio (min)', key: 'tiempoPromedio', width: 22 }
                ];
                break;
                
            case 'vehiculos':
                worksheet.columns = [
                    { header: 'Vehículo', key: 'vehiculo', width: 20 },
                    { header: 'Placa', key: 'placa', width: 12 },
                    { header: 'Color', key: 'color', width: 12 },
                    { header: 'Visitas', key: 'visitas', width: 10 },
                    { header: 'Total Gastado', key: 'totalGastado', width: 15 },
                    { header: 'Tiempo Promedio (min)', key: 'tiempoPromedio', width: 22 }
                ];
                break;
        }
    }

    // 📊 AGREGAR DATOS A EXCEL
    async agregarDatosExcel(worksheet, data, tipoReporte) {
        // Agregar título
        worksheet.addRow([`Reporte de ${this.obtenerTitulo(tipoReporte)}`]);
        worksheet.addRow([]); // Línea en blanco

        switch (tipoReporte) {
            case 'ingresos':
                // Estadísticas
                worksheet.addRow(['ESTADÍSTICAS']);
                worksheet.addRow(['Ingresos Totales', `$${data.estadisticas.ingresosTotales.toFixed(2)}`]);
                worksheet.addRow(['Total Salidas', data.estadisticas.totalSalidas]);
                worksheet.addRow(['Promedio por Salida', `$${data.estadisticas.promedioPorSalida.toFixed(2)}`]);
                worksheet.addRow([]);
                
                // Ingresos por día
                worksheet.addRow(['INGRESOS POR DÍA']);
                data.ingresosPorDia.forEach(dia => {
                    worksheet.addRow({
                        fecha: dia.fecha,
                        ingresos: `$${dia.ingresos.toFixed(2)}`,
                        salidas: dia.salidas,
                        promedio: `$${(dia.ingresos / dia.salidas || 0).toFixed(2)}`
                    });
                });
                break;
                
            case 'ocupacion':
                worksheet.addRow(['OCUPACIÓN POR HORA']);
                data.ocupacionPorHora.forEach(hora => {
                    worksheet.addRow({
                        hora: hora.hora,
                        entradas: hora.entradas,
                        tiempoPromedio: hora.tiempoPromedio.toFixed(1)
                    });
                });
                break;
                
            case 'vehiculos':
                worksheet.addRow(['VEHÍCULOS MÁS FRECUENTES']);
                data.vehiculosTop.forEach(vehiculo => {
                    worksheet.addRow({
                        vehiculo: vehiculo.vehiculo,
                        placa: vehiculo.placa,
                        color: vehiculo.color,
                        visitas: vehiculo.visitas,
                        totalGastado: `$${vehiculo.totalGastado.toFixed(2)}`,
                        tiempoPromedio: vehiculo.tiempoPromedio.toFixed(1)
                    });
                });
                break;
        }

        // Estilizar encabezados
        worksheet.getRow(4).font = { bold: true };
        worksheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        };
    }

    // 📄 AGREGAR CONTENIDO A PDF
    async agregarContenidoPDF(doc, data, tipoReporte) {
        // Configuración inicial
        doc.fontSize(20).text(`Reporte de ${this.obtenerTitulo(tipoReporte)}`, 50, 50);
        doc.fontSize(12).text(`Generado el: ${new Date().toLocaleDateString()}`, 50, 80);
        doc.moveDown(2);

        let yPosition = 120;

        switch (tipoReporte) {
            case 'ingresos':
                // Estadísticas
                doc.fontSize(16).text('ESTADÍSTICAS', 50, yPosition);
                yPosition += 30;
                
                doc.text(`Ingresos Totales: $${data.estadisticas.ingresosTotales.toFixed(2)}`, 60, yPosition);
                yPosition += 20;
                doc.text(`Total Salidas: ${data.estadisticas.totalSalidas}`, 60, yPosition);
                yPosition += 20;
                doc.text(`Promedio por Salida: $${data.estadisticas.promedioPorSalida.toFixed(2)}`, 60, yPosition);
                yPosition += 40;

                // Ingresos por día
                doc.fontSize(14).text('INGRESOS POR DÍA', 50, yPosition);
                yPosition += 25;
                
                data.ingresosPorDia.forEach(dia => {
                    if (yPosition > 700) { // Nueva página si es necesario
                        doc.addPage();
                        yPosition = 50;
                    }
                    
                    doc.text(`${dia.fecha}: $${dia.ingresos.toFixed(2)} (${dia.salidas} salidas)`, 60, yPosition);
                    yPosition += 20;
                });
                break;
                
            case 'ocupacion':
                doc.fontSize(14).text('OCUPACIÓN POR HORA', 50, yPosition);
                yPosition += 25;
                
                data.ocupacionPorHora.forEach(hora => {
                    if (yPosition > 700) {
                        doc.addPage();
                        yPosition = 50;
                    }
                    
                    doc.text(`${hora.hora}: ${hora.entradas} entradas (${hora.tiempoPromedio.toFixed(1)} min promedio)`, 60, yPosition);
                    yPosition += 20;
                });
                break;
                
            case 'vehiculos':
                doc.fontSize(14).text('VEHÍCULOS MÁS FRECUENTES', 50, yPosition);
                yPosition += 25;
                
                data.vehiculosTop.forEach(vehiculo => {
                    if (yPosition > 700) {
                        doc.addPage();
                        yPosition = 50;
                    }
                    
                    doc.text(`${vehiculo.placa} - ${vehiculo.vehiculo}`, 60, yPosition);
                    yPosition += 15;
                    doc.text(`Visitas: ${vehiculo.visitas} | Total: $${vehiculo.totalGastado.toFixed(2)} | Tiempo: ${vehiculo.tiempoPromedio.toFixed(1)} min`, 70, yPosition);
                    yPosition += 25;
                });
                break;
        }
    }

    // 🏷️ OBTENER TÍTULO DEL REPORTE
    obtenerTitulo(tipoReporte) {
        const titulos = {
            'ingresos': 'Ingresos',
            'ocupacion': 'Ocupación',
            'vehiculos': 'Vehículos'
        };
        return titulos[tipoReporte] || 'Reporte';
    }
}

module.exports = new ExportadorReportes();