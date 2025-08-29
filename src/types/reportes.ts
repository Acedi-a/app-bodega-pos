// ======================================================
// TIPOS PARA MÓDULO DE REPORTES
// Sistema completo de reportes empresariales
// ======================================================

export interface FiltrosFecha {
  fecha_inicio: string
  fecha_fin: string
}

export interface FiltrosGenerales extends FiltrosFecha {
  usuario_id?: string
  cliente_id?: number
  producto_id?: number
  insumo_id?: number
  categoria_id?: number
  proveedor_id?: number
}

// ======================================================
// REPORTES DE INVENTARIO
// ======================================================
export interface ReporteStock {
  productos_bajo_minimo: Array<{
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
    diferencia: number
    valor_stock: number
    categoria: string
    proveedor?: string
  }>
  
  insumos_bajo_minimo: Array<{
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
    diferencia: number
    valor_stock: number
    proveedor?: string
  }>
  
  productos_sin_stock: Array<{
    id: number
    nombre: string
    fecha_ultimo_movimiento: string
    dias_sin_stock: number
  }>
  
  productos_sobrestockeados: Array<{
    id: number
    nombre: string
    stock_actual: number
    stock_minimo: number
    exceso: number
    valor_exceso: number
  }>
  
  resumen: {
    total_productos: number
    productos_en_minimo: number
    productos_sin_stock: number
    valor_total_inventario: number
    valor_productos_minimo: number
  }
}

// ======================================================
// REPORTES DE VENTAS
// ======================================================
export interface ReporteVentas {
  ventas_periodo: Array<{
    fecha: string
    cantidad_ventas: number
    monto_total: number
    monto_promedio: number
  }>
  
  productos_mas_vendidos: Array<{
    producto_id: number
    nombre: string
    cantidad_vendida: number
    monto_total: number
    frecuencia_ventas: number
  }>
  
  clientes_frecuentes: Array<{
    cliente_id: number
    nombre: string
    apellido?: string
    total_compras: number
    monto_total: number
    ultima_compra: string
    frecuencia: number
  }>
  
  metodos_pago_populares: Array<{
    metodo_pago: string
    cantidad_usos: number
    monto_total: number
    porcentaje: number
  }>
  
  resumen: {
    total_ventas: number
    monto_total: number
    monto_promedio: number
    cliente_promedio: number
    producto_estrella: string
  }
}

// ======================================================
// REPORTES DE PEDIDOS
// ======================================================
export interface ReportePedidos {
  pedidos_por_estado: Array<{
    estado: string
    cantidad: number
    monto_total: number
    porcentaje: number
  }>
  
  productos_mas_pedidos: Array<{
    producto_id: number
    nombre: string
    cantidad_pedida: number
    cantidad_entregada: number
    pendiente: number
  }>
  
  pedidos_pendientes: Array<{
    id: number
    cliente: string
    fecha_pedido: string
    fecha_entrega?: string
    dias_pendiente: number
    monto_total: number
    estado: string
  }>
  
  rendimiento_entregas: {
    entregas_tiempo: number
    entregas_tarde: number
    promedio_dias_entrega: number
    porcentaje_puntualidad: number
  }
  
  resumen: {
    total_pedidos: number
    pedidos_completados: number
    pedidos_pendientes: number
    monto_total_periodo: number
  }
}

// ======================================================
// REPORTES DE CLIENTES
// ======================================================
export interface ReporteClientes {
  cliente_id: number
  nombre_completo: string
  ci?: string
  nit?: string
  telefono?: string
  direccion?: string
  
  // Estadísticas de compras
  estadisticas_compras: {
    total_compras: number
    monto_total_gastado: number
    monto_promedio_compra: number
    primera_compra: string
    ultima_compra: string
    frecuencia_compras: number // compras por mes
  }
  
  // Productos favoritos
  productos_favoritos: Array<{
    producto_id: number
    nombre: string
    cantidad_comprada: number
    monto_total: number
    frecuencia: number
  }>
  
  // Historial de compras
  historial_compras: Array<{
    venta_id: number
    fecha: string
    monto_total: number
    productos_cantidad: number
    metodo_pago: string
  }>
  
  // Pedidos del cliente
  pedidos_cliente: Array<{
    pedido_id: number
    fecha_pedido: string
    fecha_entrega?: string
    estado: string
    monto_total: number
    productos_cantidad: number
  }>
  
  // Análisis de comportamiento
  comportamiento: {
    mes_mayor_compra: string
    dia_semana_preferido: string
    hora_preferida: string
    metodo_pago_preferido: string
    categoria_preferida: string
  }
}

// ======================================================
// REPORTES DE MOVIMIENTOS
// ======================================================
export interface ReporteMovimientos {
  movimientos_productos: Array<{
    fecha: string
    producto: string
    tipo_movimiento: string
    cantidad: number
    valor_unitario: number
    valor_total: number
    usuario: string
    observaciones?: string
  }>
  
  movimientos_insumos: Array<{
    fecha: string
    insumo: string
    tipo_movimiento: string
    cantidad: number
    valor_unitario: number
    valor_total: number
    usuario: string
    observaciones?: string
  }>
  
  resumen_por_tipo: Array<{
    tipo_movimiento: string
    cantidad_movimientos: number
    valor_total: number
    porcentaje: number
  }>
  
  productos_con_mas_movimientos: Array<{
    item: string
    tipo: 'producto' | 'insumo'
    cantidad_movimientos: number
    valor_total_movimientos: number
  }>
}

// ======================================================
// REPORTES FINANCIEROS
// ======================================================
export interface ReporteFinanciero {
  ingresos_periodo: Array<{
    fecha: string
    ingresos_ventas: number
    cantidad_ventas: number
  }>
  
  gastos_periodo: Array<{
    fecha: string
    gastos_compras: number
    gastos_perdidas: number
    total_gastos: number
  }>
  
  rentabilidad_productos: Array<{
    producto_id: number
    nombre: string
    cantidad_vendida: number
    ingresos_totales: number
    costo_total: number
    ganancia_bruta: number
    margen_ganancia: number // porcentaje
  }>
  
  resumen_financiero: {
    ingresos_totales: number
    gastos_totales: number
    ganancia_bruta: number
    margen_ganancia: number
    producto_mas_rentable: string
    producto_menos_rentable: string
  }
}

// ======================================================
// DASHBOARD EJECUTIVO
// ======================================================
export interface DashboardEjecutivo {
  kpis_principales: {
    ventas_mes_actual: number
    ventas_mes_anterior: number
    crecimiento_ventas: number // porcentaje
    
    pedidos_mes_actual: number
    pedidos_mes_anterior: number
    crecimiento_pedidos: number
    
    clientes_activos: number
    clientes_nuevos_mes: number
    
    productos_bajo_minimo: number
    valor_inventario_total: number
  }
  
  tendencias_semanales: Array<{
    semana: string
    ventas: number
    pedidos: number
    clientes_nuevos: number
  }>
  
  productos_criticos: Array<{
    nombre: string
    situacion: 'sin_stock' | 'bajo_minimo' | 'sobrestockeado'
    valor: number
    accion_recomendada: string
  }>
  
  alertas_importantes: Array<{
    tipo: 'stock' | 'pedido' | 'cliente' | 'financiero'
    titulo: string
    descripcion: string
    prioridad: 'alta' | 'media' | 'baja'
    fecha: string
  }>
}

// ======================================================
// TIPOS DE FILTROS PARA REPORTES
// ======================================================
export interface FiltrosReporte {
  tipo_reporte: 'stock' | 'ventas' | 'pedidos' | 'clientes' | 'movimientos' | 'financiero' | 'ejecutivo'
  fecha_inicio: string
  fecha_fin: string
  cliente_id?: number
  producto_id?: number
  categoria_id?: number
  usuario_id?: string
  incluir_detalles?: boolean
  formato_exportacion?: 'pdf' | 'excel' | 'csv'
}

export interface ParametrosExportacion {
  formato: 'pdf' | 'excel' | 'csv'
  incluir_graficos: boolean
  incluir_resumen: boolean
  incluir_detalles: boolean
  nombre_reporte: string
}
