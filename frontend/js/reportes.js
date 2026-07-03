/**
 * SIGAE - LÓGICA DE REPORTES
 * Archivo: frontend/js/reportes.js
 * 
 * Funciones para el módulo de reportes:
 * - Ocupación por turno (gráfica de barras)
 * - Tipos de espacio (gráfica de pastel)
 * - Inventario de infraestructura (tabla)
 */

let chartOcupacion = null;
let chartTipos = null;

// =====================================================
// INICIALIZAR REPORTES
// =====================================================
async function inicializarReportes() {
    try {
        const res = await fetch('/api/config/ciclo');
        const data = await res.json();
        
        // Actualizar ciclo
        const cicloElement = document.getElementById('ciclo-actual-text');
        if (cicloElement) {
            cicloElement.textContent = data.ciclo || '2026-A';
        } else {
            console.warn('⚠️ Elemento #ciclo-actual-text no encontrado');
        }
        
        // Actualizar fecha
        const fechaElement = document.getElementById('fecha-reporte');
        if (fechaElement) {
            fechaElement.textContent = data.fecha || new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            console.warn('⚠️ Elemento #fecha-reporte no encontrado');
        }
        
    } catch (error) {
        console.error('Error cargando ciclo:', error);
        // Fallback con fecha local
        const fecha = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const fechaElement = document.getElementById('fecha-reporte');
        if (fechaElement) {
            fechaElement.textContent = fecha;
        }
    }
    
    await Promise.all([
        cargarOcupacionTurno(),
        cargarTiposEspacio(),
        cargarInventario()
    ]);
}

// =====================================================
// OCUPACIÓN POR TURNO (Gráfica de barras)
// =====================================================
async function cargarOcupacionTurno() {
    try {
        const res = await fetch('/api/reportes/ocupacion-turno');
        const data = await res.json();
        
        // Procesar datos para la gráfica
        const edificios = [];
        const matutino = [];
        const vespertino = [];
        
        // Agrupar por edificio
        const edificiosMap = {};
        data.forEach(item => {
            if (!edificiosMap[item.edificio]) {
                edificiosMap[item.edificio] = { matutino: 0, vespertino: 0 };
            }
            if (item.turno === 'Matutino') {
                edificiosMap[item.edificio].matutino = item.porcentaje || 0;
            } else {
                edificiosMap[item.edificio].vespertino = item.porcentaje || 0;
            }
        });
        
        for (const [edificio, valores] of Object.entries(edificiosMap)) {
            edificios.push(edificio);
            matutino.push(valores.matutino);
            vespertino.push(valores.vespertino);
        }
        
        // Crear gráfica
        const ctx = document.getElementById('chartOcupacionTurno').getContext('2d');
        
        // Destruir gráfica anterior si existe
        if (chartOcupacion) {
            chartOcupacion.destroy();
        }
        
        chartOcupacion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: edificios,
                datasets: [
                    {
                        label: 'Matutino',
                        data: matutino,
                        backgroundColor: 'rgba(139, 28, 42, 0.7)',
                        borderColor: '#8B1C2A',
                        borderWidth: 2,
                        borderRadius: 4
                    },
                    {
                        label: 'Vespertino',
                        data: vespertino,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: '#3498db',
                        borderWidth: 2,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error cargando ocupación por turno:', error);
        document.querySelector('#chartOcupacionTurno').parentElement.innerHTML = 
            '<p style="color: red; text-align: center; padding: 40px;">❌ Error al cargar datos de ocupación</p>';
    }
}

// =====================================================
// TIPOS DE ESPACIO (Gráfica de pastel)
// =====================================================
async function cargarTiposEspacio() {
    try {
        const res = await fetch('/api/reportes/tipos-espacio');
        const data = await res.json();
        
        const labels = data.map(item => item.tipo);
        const values = data.map(item => item.cantidad);
        const total = values.reduce((a, b) => a + b, 0);
        
        const colores = [
            '#8B1C2A',
            '#3498db',
            '#2ecc71',
            '#f39c12',
            '#9b59b6'
        ];
        
        // Crear gráfica
        const ctx = document.getElementById('chartTiposEspacio').getContext('2d');
        
        if (chartTipos) {
            chartTipos.destroy();
        }
        
        chartTipos = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colores.slice(0, labels.length),
                    borderWidth: 3,
                    borderColor: 'white'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 13 },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const porcentaje = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + porcentaje + '%)';
                            }
                        }
                    }
                }
            }
        });
        
        // Mostrar total en el centro de la gráfica
        // (opcional, se puede agregar un plugin)
        
    } catch (error) {
        console.error('Error cargando tipos de espacio:', error);
        document.querySelector('#chartTiposEspacio').parentElement.innerHTML = 
            '<p style="color: red; text-align: center; padding: 40px;">❌ Error al cargar tipos de espacio</p>';
    }
}

// =====================================================
// INVENTARIO DE INFRAESTRUCTURA (Tabla)
// =====================================================
async function cargarInventario() {
    try {
        const res = await fetch('/api/infraestructura/edificios');
        const edificios = await res.json();
        
        // Para cada edificio, obtener detalle
        const inventario = [];
        for (const edificio of edificios) {
            const detalleRes = await fetch(`/api/infraestructura/edificio/${edificio.id_edificio}/detalle`);
            const detalle = await detalleRes.json();
            
            // Calcular capacidad total
            let capacidadTotal = 0;
            let totalAulas = 0;
            let plantaBaja = 0;
            let plantaAlta = 0;
            let disponibles = 0;
            
            if (detalle.aulas) {
                detalle.aulas.forEach(aula => {
                    capacidadTotal += aula.capacidad || 0;
                    totalAulas++;
                    if (aula.piso === 'Planta Baja') plantaBaja++;
                    else plantaAlta++;
                    if (aula.porcentaje_ocupacion < 20) disponibles++;
                });
            }
            
            inventario.push({
                nombre: detalle.edificio_nombre || edificio.nombre,
                total_espacios: totalAulas,
                planta_baja: plantaBaja,
                planta_alta: plantaAlta,
                capacidad_total: capacidadTotal,
                disponibles: disponibles,
                ocupacion_prom: detalle.total_aulas > 0 
                    ? Math.round(((detalle.total_aulas - disponibles) / detalle.total_aulas) * 100)
                    : 0
            });
        }
        
        // Mostrar en la tabla
        mostrarInventario(inventario);
        
    } catch (error) {
        console.error('Error cargando inventario:', error);
        document.getElementById('inventario-table').innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color: red;">Error al cargar inventario</td>
            </tr>
        `;
    }
}

function mostrarInventario(inventario) {
    const tbody = document.getElementById('inventario-table');
    
    if (!inventario || inventario.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">No hay datos de inventario</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inventario.map(item => {
        // Clase para el badge de ocupación
        let badgeClass = 'badge-baja';
        let badgeText = 'Baja';
        if (item.ocupacion_prom >= 70) {
            badgeClass = 'badge-alta';
            badgeText = 'Alta';
        } else if (item.ocupacion_prom >= 40) {
            badgeClass = 'badge-media';
            badgeText = 'Media';
        }
        
        return `
            <tr>
                <td><strong>${item.nombre}</strong></td>
                <td class="text-center">${item.total_espacios}</td>
                <td class="text-center">${item.planta_baja}</td>
                <td class="text-center">${item.planta_alta}</td>
                <td class="text-center">${item.capacidad_total} lug.</td>
                <td class="text-center">${item.disponibles}</td>
                <td class="text-center">
                    <span class="badge-ocupacion ${badgeClass}">${item.ocupacion_prom}%</span>
                </td>
            </tr>
        `;
    }).join('');
}

// =====================================================
// INICIALIZAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarUsuario();
    inicializarReportes();
});