// 🎯 CONFIGURACIÓN Y ESTADO GLOBAL
class ParqueitoApp {
    constructor() {
        this.token = localStorage.getItem('parqueito_token');
        this.user = null;
        this.dashboardData = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        
        if (this.token) {
            this.loadDashboard();
            this.startAutoRefresh();
        }
    }

    // 🔐 MANEJO DE AUTENTICACIÓN
    checkAuth() {
        if (this.token) {
            this.showDashboard();
            this.loadUserProfile();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('dashboardScreen').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboardScreen').classList.add('active');
    }

    // 📡 COMUNICACIÓN CON LA API
    async apiCall(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(`http://localhost:3000/api${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    // 👤 PERFIL DE USUARIO
    async loadUserProfile() {
        try {
            const data = await this.apiCall('/auth/profile');
            this.user = data.data.user;
            this.updateUserInfo();
        } catch (error) {
            this.logout();
        }
    }

    updateUserInfo() {
        if (this.user) {
            document.getElementById('userInfo').textContent = 
                `${this.user.nombre} (${this.user.rol})`;
        }
    }

    // 📊 DASHBOARD PRINCIPAL
    async loadDashboard() {
        try {
            const data = await this.apiCall('/dashboard/estadisticas');
            this.dashboardData = data.data;
            this.updateDashboardUI();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    updateDashboardUI() {
        if (!this.dashboardData) return;

        const { metricas, ultimosRegistros, vehiculosFrecuentes } = this.dashboardData;

        // 🎯 ACTUALIZAR MÉTRICAS PRINCIPALES
        document.getElementById('metric-total').textContent = metricas.espacios.total;
        document.getElementById('metric-available').textContent = metricas.espacios.disponibles;
        document.getElementById('metric-occupied').textContent = metricas.espacios.ocupados;
        document.getElementById('metric-income').textContent = `$${metricas.ingresosHoy.toFixed(2)}`;
        document.getElementById('activeCount').textContent = metricas.vehiculosActivos;
        document.getElementById('stat-registros').textContent = metricas.registrosHoy;
        document.getElementById('stat-ocupacion').textContent = `${metricas.ocupacion}%`;

        // 🚗 ACTUALIZAR LISTA DE VEHÍCULOS ACTIVOS
        this.updateActiveVehiclesList(ultimosRegistros);

        // 🏆 ACTUALIZAR VEHÍCULOS FRECUENTES
        this.updateFrequentVehicles(vehiculosFrecuentes);
    }

    updateActiveVehiclesList(vehiculos) {
        const container = document.getElementById('activeVehiclesList');
        
        if (vehiculos.length === 0) {
            container.innerHTML = '<div class="loading">No hay vehículos en el parqueo</div>';
            return;
        }

        container.innerHTML = vehiculos.map(vehiculo => `
            <div class="vehicle-item">
                <div class="vehicle-info">
                    <h4>
                        <span class="placa">${vehiculo.placa}</span> - 
                        ${vehiculo.vehiculo}
                    </h4>
                    <div class="vehicle-color">Color: ${vehiculo.color}</div>
                    <div class="vehicle-time">
                        Entrada: ${new Date(vehiculo.horaEntrada).toLocaleTimeString()}
                    </div>
                </div>
                <div class="vehicle-details">
                    <span class="vehicle-space">${vehiculo.espacio}</span>
                    <div class="employee">Por: ${vehiculo.registradoPor}</div>
                </div>
            </div>
        `).join('');
    }

    updateFrequentVehicles(vehiculos) {
        const container = document.getElementById('frequentVehiclesList');
        
        if (vehiculos.length === 0) {
            container.innerHTML = '<div class="loading">No hay datos de vehículos frecuentes</div>';
            return;
        }

        container.innerHTML = vehiculos.map(vehiculo => `
            <div class="frequent-item">
                <div class="frequent-info">
                    <strong>${vehiculo.placa}</strong>
                    <div class="frequent-model">${vehiculo.vehiculo}</div>
                </div>
                <span class="frequent-visits">${vehiculo.visitas} visitas</span>
            </div>
        `).join('');
    }

    // 🔄 ACTUALIZACIÓN AUTOMÁTICA
    startAutoRefresh() {
        setInterval(() => {
            this.loadDashboard();
        }, 30000); // Actualizar cada 30 segundos
    }

    // 📱 MANEJO DE FORMULARIOS
    setupEventListeners() {
        // 🔐 LOGIN
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 🚪 LOGOUT
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // 🚗 ACCIONES RÁPIDAS
        document.getElementById('btnRegistrarEntrada').addEventListener('click', () => {
            this.showModal('modalEntrada');
        });

        document.getElementById('btnRegistrarSalida').addEventListener('click', () => {
            this.showModal('modalSalida');
        });

        document.getElementById('btnBuscarVehiculo').addEventListener('click', () => {
            this.toggleSearch();
        });

        document.getElementById('btnSearch').addEventListener('click', () => {
            this.handleSearch();
        });

        // 📝 FORMULARIOS DE MODALES
        document.getElementById('formEntrada').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistrarEntrada();
        });

        document.getElementById('formSalida').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistrarSalida();
        });

        // ❌ BOTONES DE CANCELAR
        document.getElementById('cancelarEntrada').addEventListener('click', () => {
            this.hideModal('modalEntrada');
        });

        document.getElementById('cancelarSalida').addEventListener('click', () => {
            this.hideModal('modalSalida');
        });

        // 🗂️ CERRA MODALES AL HACER CLICK FUERA
        this.setupModalCloseListeners();

        // 📊 REPORTES

// Navegación a reportes
document.getElementById('btnVerReportes').addEventListener('click', () => {
    this.showReportes();
});

// Volver al dashboard desde reportes
document.getElementById('volverDashboardBtn').addEventListener('click', () => {
    this.showDashboard();
});

// Logout desde reportes
document.getElementById('logoutBtnReportes').addEventListener('click', () => {
    this.logout();
});

// Generar reporte
document.getElementById('generarReporteBtn').addEventListener('click', () => {
    this.generarReporte();
});

// Cambiar tipo de reporte
document.getElementById('tipoReporte').addEventListener('change', (e) => {
    this.actualizarFiltrosReporte(e.target.value);
});

// Exportar reporte
document.getElementById('exportarReporteBtn').addEventListener('click', () => {
    this.exportarReporte();
});
    }

    // 🔄 ACTUALIZAR FILTROS SEGÚN TIPO DE REPORTE
actualizarFiltrosReporte(tipoReporte) {
    const fechaInicioGroup = document.getElementById('fechaInicio').parentElement;
    const fechaFinGroup = document.getElementById('fechaFin').parentElement;
    const fechaEspecificaGroup = document.getElementById('fechaEspecifica').parentElement;

    // Ocultar todos primero
    fechaInicioGroup.style.display = 'none';
    fechaFinGroup.style.display = 'none';
    fechaEspecificaGroup.style.display = 'none';

    // Mostrar según el tipo
    switch (tipoReporte) {
        case 'ingresos':
        case 'vehiculos':
            fechaInicioGroup.style.display = 'flex';
            fechaFinGroup.style.display = 'flex';
            break;
        case 'ocupacion':
            fechaEspecificaGroup.style.display = 'flex';
            break;
    }
}

// 📥 EXPORTAR REPORTE
exportarReporte() {
    this.showNotification('Función de exportación en desarrollo', 'info');
}

    // 🔐 MANEJO DE LOGIN
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const formData = new FormData(form);
        
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const data = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            this.token = data.data.token;
            localStorage.setItem('parqueito_token', this.token);
            
            this.showNotification('¡Login exitoso!', 'success');
            this.showDashboard();
            this.loadUserProfile();
            this.loadDashboard();
            this.startAutoRefresh();

        } catch (error) {
            this.showNotification('Credenciales incorrectas', 'error');
        }
    }

    // 🚪 LOGOUT
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('parqueito_token');
        this.showLogin();
        this.showNotification('Sesión cerrada', 'info');
    }

    // 🚗 REGISTRAR ENTRADA
    async handleRegistrarEntrada() {
        const form = document.getElementById('formEntrada');
        const formData = new FormData(form);
        
        const vehiculoData = {
            placa: formData.get('placa').toUpperCase(),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            color: formData.get('color')
        };

        try {
            const data = await this.apiCall('/vehiculos/entrada', {
                method: 'POST',
                body: JSON.stringify(vehiculoData)
            });

            this.showNotification('Vehículo registrado exitosamente', 'success');
            this.hideModal('modalEntrada');
            form.reset();
            this.loadDashboard(); // Recargar datos

        } catch (error) {
            // El error ya se maneja en apiCall
        }
    }

    // 🚗 REGISTRAR SALIDA
    async handleRegistrarSalida() {
        const form = document.getElementById('formSalida');
        const formData = new FormData(form);
        
        const salidaData = {
            placa: formData.get('placa').toUpperCase()
        };

        try {
            const data = await this.apiCall('/vehiculos/salida', {
                method: 'POST',
                body: JSON.stringify(salidaData)
            });

            this.showNotification(
                `Salida registrada. Monto: $${data.data.registro.monto}`, 
                'success'
            );
            this.hideModal('modalSalida');
            form.reset();
            this.loadDashboard(); // Recargar datos

        } catch (error) {
            // El error ya se maneja en apiCall
        }
    }

    // 🔍 BÚSQUEDA DE VEHÍCULOS
    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        
        if (query.length < 2) {
            this.showNotification('Ingrese al menos 2 caracteres', 'warning');
            return;
        }

        try {
            const data = await this.apiCall(`/dashboard/busqueda?query=${encodeURIComponent(query)}`);
            this.displaySearchResults(data.data.resultados);
        } catch (error) {
            // El error ya se maneja en apiCall
        }
    }

    displaySearchResults(resultados) {
        const container = document.getElementById('searchResults');
        
        if (resultados.length === 0) {
            container.innerHTML = '<div class="loading">No se encontraron resultados</div>';
            return;
        }

        container.innerHTML = resultados.map(resultado => `
            <div class="search-result-item">
                <div class="result-placa">${resultado.placa}</div>
                <div class="result-desc">${resultado.descripcion}</div>
                <div class="result-status ${resultado.estaEnParqueo ? 'in-parking' : 'not-in-parking'}">
                    ${resultado.estaEnParqueo ? 
                        `🅿️ En parqueo (Espacio: ${resultado.espacio})` : 
                        '❌ No en parqueo'
                    }
                </div>
            </div>
        `).join('');
    }

    // 🎪 MANEJO DE MODALES
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    setupModalCloseListeners() {
        // Cerrar modal al hacer click fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Cerrar modal con botón X
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
    }

    toggleSearch() {
        const container = document.getElementById('searchContainer');
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('searchInput').focus();
        }
    }

    // 💬 NOTIFICACIONES
    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notifications.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // 🔄 NAVEGACIÓN ENTRE PANTALLAS
showReportes() {
    document.getElementById('dashboardScreen').classList.remove('active');
    document.getElementById('reportesScreen').classList.add('active');
    this.updateUserInfoReportes();
    this.cargarEstadisticasRapidas();
}

showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    document.getElementById('reportesScreen').classList.remove('active');
    this.updateUserInfo();
}

updateUserInfoReportes() {
    if (this.user) {
        document.getElementById('userInfoReportes').textContent = 
            `${this.user.nombre} (${this.user.rol})`;
    }
}

// 📊 CARGAR ESTADÍSTICAS RÁPIDAS
async cargarEstadisticasRapidas() {
    try {
        // Cargar reporte del mes actual para estadísticas rápidas
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        
        const data = await this.apiCall(
            `/reportes/ingresos?fechaInicio=${inicioMes.toISOString().split('T')[0]}&fechaFin=${finMes.toISOString().split('T')[0]}`
        );

        if (data.success) {
            // Actualizar estadísticas rápidas
            document.getElementById('ingresosMes').textContent = 
                `$${data.data.estadisticas.ingresosTotales.toFixed(2)}`;
            document.getElementById('vehiculosMes').textContent = 
                data.data.estadisticas.totalSalidas;
            
            if (data.data.vehiculosFrecuentes.length > 0) {
                document.getElementById('vehiculoFrecuente').textContent = 
                    data.data.vehiculosFrecuentes[0].placa;
            }
            
            if (data.data.horasPico.length > 0) {
                document.getElementById('horaPico').textContent = 
                    data.data.horasPico[0].hora;
            }
        }
    } catch (error) {
        console.error('Error cargando estadísticas rápidas:', error);
    }
}

// 🎯 GENERAR REPORTE
async generarReporte() {
    const tipoReporte = document.getElementById('tipoReporte').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const fechaEspecifica = document.getElementById('fechaEspecifica').value;

    try {
        document.getElementById('loadingReporte').style.display = 'block';
        document.getElementById('resultadosReporte').innerHTML = '';

        let url = '';
        let params = new URLSearchParams();

        switch (tipoReporte) {
            case 'ingresos':
                if (fechaInicio) params.append('fechaInicio', fechaInicio);
                if (fechaFin) params.append('fechaFin', fechaFin);
                url = `/reportes/ingresos?${params.toString()}`;
                break;
                
            case 'ocupacion':
                if (fechaEspecifica) params.append('fecha', fechaEspecifica);
                url = `/reportes/ocupacion?${params.toString()}`;
                break;
                
            case 'vehiculos':
                if (fechaInicio) params.append('fechaInicio', fechaInicio);
                if (fechaFin) params.append('fechaFin', fechaFin);
                url = `/reportes/vehiculos?${params.toString()}`;
                break;
        }

        const data = await this.apiCall(url);
        this.mostrarResultadosReporte(data, tipoReporte);
        
    } catch (error) {
        console.error('Error generando reporte:', error);
    } finally {
        document.getElementById('loadingReporte').style.display = 'none';
    }
}

// 📈 MOSTRAR RESULTADOS DEL REPORTE
mostrarResultadosReporte(data, tipoReporte) {
    const container = document.getElementById('resultadosReporte');
    const countBadge = document.getElementById('resultadosCount');
    
    if (!data.success) {
        container.innerHTML = '<div class="error">Error al generar el reporte</div>';
        countBadge.textContent = '0';
        return;
    }

    let html = '';
    
    switch (tipoReporte) {
        case 'ingresos':
            html = this.formatearReporteIngresos(data.data);
            countBadge.textContent = data.data.periodo.dias || '0';
            break;
            
        case 'ocupacion':
            html = this.formatearReporteOcupacion(data.data);
            countBadge.textContent = data.data.ocupacionPorHora.length || '0';
            break;
            
        case 'vehiculos':
            html = this.formatearReporteVehiculos(data.data);
            countBadge.textContent = data.data.vehiculosTop.length || '0';
            break;
    }

    container.innerHTML = html;
    document.getElementById('exportarReporteBtn').style.display = 'inline-block';
}

// 📊 FORMATEAR REPORTE DE INGRESOS
formatearReporteIngresos(data) {
    return `
        <div class="metricas-reporte">
            <div class="metrica-reporte">
                <div class="metrica-valor">$${data.estadisticas.ingresosTotales.toFixed(2)}</div>
                <div class="metrica-label">Ingresos Totales</div>
            </div>
            <div class="metrica-reporte">
                <div class="metrica-valor">${data.estadisticas.totalSalidas}</div>
                <div class="metrica-label">Total Salidas</div>
            </div>
            <div class="metrica-reporte">
                <div class="metrica-valor">$${data.estadisticas.promedioPorSalida.toFixed(2)}</div>
                <div class="metrica-label">Promedio por Salida</div>
            </div>
        </div>

        <div class="grafico-container">
            <h4>📈 Ingresos por Día</h4>
            <div class="grafico-placeholder">
                <i class="fas fa-chart-line fa-2x"></i>
                <div>Gráfico de ingresos diarios</div>
            </div>
        </div>

        <table class="reporte-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Ingresos</th>
                    <th>Salidas</th>
                </tr>
            </thead>
            <tbody>
                ${data.ingresosPorDia.map(dia => `
                    <tr>
                        <td>${dia.fecha}</td>
                        <td>$${dia.ingresos.toFixed(2)}</td>
                        <td>${dia.salidas}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 30px;">
            <h4>🚗 Vehículos Más Frecuentes</h4>
            <table class="reporte-table">
                <thead>
                    <tr>
                        <th>Vehículo</th>
                        <th>Visitas</th>
                        <th>Total Gastado</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.vehiculosFrecuentes.map(vehiculo => `
                        <tr>
                            <td>${vehiculo.placa} - ${vehiculo.vehiculo}</td>
                            <td>${vehiculo.visitas}</td>
                            <td>$${vehiculo.totalGastado.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 🅿️ FORMATEAR REPORTE DE OCUPACIÓN
formatearReporteOcupacion(data) {
    return `
        <h4>📅 Ocupación para ${data.fecha}</h4>
        
        <div class="grafico-container">
            <h4>🕒 Ocupación por Hora</h4>
            <div class="grafico-placeholder">
                <i class="fas fa-chart-bar fa-2x"></i>
                <div>Gráfico de ocupación horaria</div>
            </div>
        </div>

        <table class="reporte-table">
            <thead>
                <tr>
                    <th>Hora</th>
                    <th>Entradas</th>
                    <th>Tiempo Promedio (min)</th>
                </tr>
            </thead>
            <tbody>
                ${data.ocupacionPorHora.map(hora => `
                    <tr>
                        <td>${hora.hora}</td>
                        <td>${hora.entradas}</td>
                        <td>${hora.tiempoPromedio.toFixed(1)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 30px;">
            <h4>🅿️ Espacios Más Utilizados</h4>
            <table class="reporte-table">
                <thead>
                    <tr>
                        <th>Espacio</th>
                        <th>Veces Utilizado</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.espaciosUtilizados.map(espacio => `
                        <tr>
                            <td>${espacio.espacio}</td>
                            <td>${espacio.uso}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 🚗 FORMATEAR REPORTE DE VEHÍCULOS
formatearReporteVehiculos(data) {
    return `
        <h4>📊 Vehículos del ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}</h4>
        
        <table class="reporte-table">
            <thead>
                <tr>
                    <th>Vehículo</th>
                    <th>Placa</th>
                    <th>Color</th>
                    <th>Visitas</th>
                    <th>Total Gastado</th>
                    <th>Tiempo Promedio (min)</th>
                </tr>
            </thead>
            <tbody>
                ${data.vehiculosTop.map(vehiculo => `
                    <tr>
                        <td>${vehiculo.vehiculo}</td>
                        <td>${vehiculo.placa}</td>
                        <td>${vehiculo.color}</td>
                        <td>${vehiculo.visitas}</td>
                        <td>$${vehiculo.totalGastado.toFixed(2)}</td>
                        <td>${vehiculo.tiempoPromedio.toFixed(1)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 30px;">
            <h4>🏭 Marcas Más Comunes</h4>
            <table class="reporte-table">
                <thead>
                    <tr>
                        <th>Marca</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.marcasComunes.map(marca => `
                        <tr>
                            <td>${marca.marca}</td>
                            <td>${marca.cantidad}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
}


// 🛠️ FUNCIONES GLOBALES ÚTILES
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 🎯 INICIALIZAR FECHAS POR DEFECTO
function inicializarFechas() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Formatear fechas para inputs
    document.getElementById('fechaInicio').value = inicioMes.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];
    document.getElementById('fechaEspecifica').value = hoy.toISOString().split('T')[0];
    
    // Ocultar filtros inicialmente
    document.getElementById('fechaEspecifica').parentElement.style.display = 'none';
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ParqueitoApp();
    inicializarFechas();
});
