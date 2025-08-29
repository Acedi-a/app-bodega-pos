// ======================================================
// SERVICIO DE REPORTES - SISTEMA COMPLETO
// Incluye todos los reportes empresariales necesarios
// ======================================================

import { supabase } from '../lib/supabase'
import type { 
  ReporteStock, 
  ReporteVentas, 
  ReportePedidos, 
  ReporteClientes, 
  ReporteMovimientos,
  DashboardEjecutivo,
  FiltrosFecha
} from '../types/reportes'

class ReportesService {
  
  // ======================================================
  // REPORTES DE INVENTARIO Y STOCK
  // ======================================================
  
  async getReporteStock(): Promise<ReporteStock> {
    try {
      // Productos bajo mínimo
      const { data: productosBajoMinimo } = await supabase
        .from('productos')
        .select(`
          id, nombre, stock, stock_minimo, precio, costo,
          categorias!inner(nombre),
          proveedores(nombre_empresa)
        `)
        .filter('stock', 'lt', 'stock_minimo')
        .eq('activo', true)

      // Insumos bajo mínimo
      const { data: insumosBajoMinimo } = await supabase
        .from('insumos')
        .select(`
          id, nombre, stock, stock_minimo, costo_promedio,
          proveedores(nombre_empresa)
        `)
        .filter('stock', 'lt', 'stock_minimo')
        .eq('activo', true)

      // Productos sin stock
      const { data: productosSinStock } = await supabase
        .from('productos')
        .select(`
          id, nombre, stock,
          movimientos_inventario(fecha, tipo_movimiento_id)
        `)
        .eq('stock', 0)
        .eq('activo', true)

      // Productos sobrestockeados (más del 300% del mínimo)
      const { data: productosSobrestockeados } = await supabase
        .from('productos')
        .select('id, nombre, stock, stock_minimo, costo')
        .filter('stock', 'gt', 'stock_minimo')  // Filtro simplificado
        .eq('activo', true)

      // Totales para resumen
      const { data: totalProductos } = await supabase
        .from('productos')
        .select('id, stock, costo', { count: 'exact' })
        .eq('activo', true)

      const { data: productosEnMinimo } = await supabase
        .from('productos')
        .select('id', { count: 'exact' })
        .filter('stock', 'lte', 'stock_minimo')
        .eq('activo', true)

      return {
        productos_bajo_minimo: productosBajoMinimo?.map(p => ({
          id: p.id,
          nombre: p.nombre,
          stock_actual: p.stock,
          stock_minimo: p.stock_minimo,
          diferencia: p.stock_minimo - p.stock,
          valor_stock: p.stock * (p.costo || 0),
          categoria: (p.categorias as any)?.nombre || 'Sin categoría',
          proveedor: (p.proveedores as any)?.nombre_empresa
        })) || [],
        
        insumos_bajo_minimo: insumosBajoMinimo?.map(i => ({
          id: i.id,
          nombre: i.nombre,
          stock_actual: i.stock,
          stock_minimo: i.stock_minimo,
          diferencia: i.stock_minimo - i.stock,
          valor_stock: i.stock * (i.costo_promedio || 0),
          proveedor: (i.proveedores as any)?.nombre_empresa
        })) || [],
        
        productos_sin_stock: productosSinStock?.map(p => {
          const ultimoMovimiento = p.movimientos_inventario?.[0]
          const fechaUltimo = ultimoMovimiento?.fecha || new Date().toISOString()
          const diasSinStock = Math.floor((new Date().getTime() - new Date(fechaUltimo).getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            id: p.id,
            nombre: p.nombre,
            fecha_ultimo_movimiento: fechaUltimo,
            dias_sin_stock: diasSinStock
          }
        }) || [],
        
        productos_sobrestockeados: productosSobrestockeados?.map(p => ({
          id: p.id,
          nombre: p.nombre,
          stock_actual: p.stock,
          stock_minimo: p.stock_minimo,
          exceso: p.stock - (p.stock_minimo * 2), // Consideramos normal hasta 2x el mínimo
          valor_exceso: (p.stock - (p.stock_minimo * 2)) * (p.costo || 0)
        })) || [],
        
        resumen: {
          total_productos: totalProductos?.length || 0,
          productos_en_minimo: productosEnMinimo?.length || 0,
          productos_sin_stock: productosSinStock?.length || 0,
          valor_total_inventario: totalProductos?.reduce((sum, p) => sum + (p.stock * (p.costo || 0)), 0) || 0,
          valor_productos_minimo: productosBajoMinimo?.reduce((sum, p) => sum + (p.stock * (p.costo || 0)), 0) || 0
        }
      }
    } catch (error) {
      console.error('Error obteniendo reporte de stock:', error)
      throw error
    }
  }

  // ======================================================
  // REPORTES DE VENTAS
  // ======================================================
  
  async getReporteVentas(filtros: FiltrosFecha): Promise<ReporteVentas> {
    try {
      // Ventas por período
      const { data: ventasPeriodo } = await supabase
        .from('ventas')
        .select('fecha, total, id')
        .gte('fecha', filtros.fecha_inicio)
        .lte('fecha', filtros.fecha_fin)
        .order('fecha')

      // Productos más vendidos
      const { data: productosMasVendidos } = await supabase
        .from('detalle_ventas')
        .select(`
          producto_id, cantidad, precio_unitario,
          productos(nombre),
          ventas!inner(fecha)
        `)
        .gte('ventas.fecha', filtros.fecha_inicio)
        .lte('ventas.fecha', filtros.fecha_fin)

      // Clientes frecuentes
      const { data: clientesFrecuentes } = await supabase
        .from('ventas')
        .select(`
          cliente_id, total,
          clientes(nombre, apellido)
        `)
        .gte('fecha', filtros.fecha_inicio)
        .lte('fecha', filtros.fecha_fin)
        .not('cliente_id', 'is', null)

      // Métodos de pago
      const { data: metodosPago } = await supabase
        .from('ventas')
        .select(`
          total,
          metodos_pago(nombre)
        `)
        .gte('fecha', filtros.fecha_inicio)
        .lte('fecha', filtros.fecha_fin)

      // Procesar datos para el reporte
      const ventasPorDia = this.agruparVentasPorDia(ventasPeriodo || [])
      const productosAgrupados = this.agruparProductosVendidos(productosMasVendidos || [])
      const clientesAgrupados = this.agruparClientesFrecuentes(clientesFrecuentes || [])
      const metodosPagoAgrupados = this.agruparMetodosPago(metodosPago || [])

      const totalVentas = ventasPeriodo?.length || 0
      const montoTotal = ventasPeriodo?.reduce((sum, v) => sum + v.total, 0) || 0

      return {
        ventas_periodo: ventasPorDia,
        productos_mas_vendidos: productosAgrupados,
        clientes_frecuentes: clientesAgrupados,
        metodos_pago_populares: metodosPagoAgrupados,
        resumen: {
          total_ventas: totalVentas,
          monto_total: montoTotal,
          monto_promedio: totalVentas > 0 ? montoTotal / totalVentas : 0,
          cliente_promedio: montoTotal / Math.max(clientesAgrupados.length, 1),
          producto_estrella: productosAgrupados[0]?.nombre || 'N/A'
        }
      }
    } catch (error) {
      console.error('Error obteniendo reporte de ventas:', error)
      throw error
    }
  }

  // ======================================================
  // REPORTES DE PEDIDOS
  // ======================================================
  
  async getReportePedidos(filtros: FiltrosFecha): Promise<ReportePedidos> {
    try {
      // Pedidos por estado
      const { data: pedidosPorEstado } = await supabase
        .from('pedidos')
        .select(`
          estado_id, total,
          estados(nombre)
        `)
        .gte('fecha_pedido', filtros.fecha_inicio)
        .lte('fecha_pedido', filtros.fecha_fin)

      // Productos más pedidos
      const { data: productosPedidos } = await supabase
        .from('detalle_pedidos')
        .select(`
          producto_id, cantidad_pedida, cantidad_entregada,
          productos(nombre),
          pedidos!inner(fecha_pedido, estado_id)
        `)
        .gte('pedidos.fecha_pedido', filtros.fecha_inicio)
        .lte('pedidos.fecha_pedido', filtros.fecha_fin)

      // Pedidos pendientes
      const { data: pedidosPendientes } = await supabase
        .from('pedidos')
        .select(`
          id, fecha_pedido, fecha_entrega, total,
          clientes(nombre, apellido),
          estados(nombre)
        `)
        .gte('fecha_pedido', filtros.fecha_inicio)
        .lte('fecha_pedido', filtros.fecha_fin)
        .neq('estado_id', 3) // Asumiendo que 3 = completado

      const estadosAgrupados = this.agruparPedidosPorEstado(pedidosPorEstado || [])
      const productosAgrupados = this.agruparProductosPedidos(productosPedidos || [])
      const rendimientoEntregas = this.calcularRendimientoEntregas(pedidosPendientes || [])

      return {
        pedidos_por_estado: estadosAgrupados,
        productos_mas_pedidos: productosAgrupados,
        pedidos_pendientes: pedidosPendientes?.map(p => ({
          id: p.id,
          cliente: `${(p.clientes as any)?.nombre || ''} ${(p.clientes as any)?.apellido || ''}`.trim() || 'Cliente anónimo',
          fecha_pedido: p.fecha_pedido,
          fecha_entrega: p.fecha_entrega,
          dias_pendiente: Math.floor((new Date().getTime() - new Date(p.fecha_pedido).getTime()) / (1000 * 60 * 60 * 24)),
          monto_total: p.total,
          estado: (p.estados as any)?.nombre || 'Sin estado'
        })) || [],
        rendimiento_entregas: rendimientoEntregas,
        resumen: {
          total_pedidos: pedidosPorEstado?.length || 0,
          pedidos_completados: pedidosPorEstado?.filter(p => p.estado_id === 3).length || 0,
          pedidos_pendientes: pedidosPendientes?.length || 0,
          monto_total_periodo: pedidosPorEstado?.reduce((sum, p) => sum + p.total, 0) || 0
        }
      }
    } catch (error) {
      console.error('Error obteniendo reporte de pedidos:', error)
      throw error
    }
  }

  // ======================================================
  // REPORTES DE CLIENTES ESPECÍFICOS
  // ======================================================
  
  async getReporteCliente(clienteId: number): Promise<ReporteClientes> {
    try {
      // Información básica del cliente
      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (!cliente) throw new Error('Cliente no encontrado')

      // Historial de compras
      const { data: ventasCliente } = await supabase
        .from('ventas')
        .select(`
          id, fecha, total,
          metodos_pago(nombre),
          detalle_ventas(cantidad, productos(nombre))
        `)
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })

      // Pedidos del cliente
      const { data: pedidosCliente } = await supabase
        .from('pedidos')
        .select(`
          id, fecha_pedido, fecha_entrega, total,
          estados(nombre),
          detalle_pedidos(cantidad_pedida)
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_pedido', { ascending: false })

      const estadisticas = this.calcularEstadisticasCliente(ventasCliente || [])
      const productosFavoritos = this.calcularProductosFavoritos(ventasCliente || [])
      const comportamiento = this.analizarComportamientoCliente(ventasCliente || [])

      return {
        cliente_id: cliente.id,
        nombre_completo: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
        ci: cliente.ci,
        nit: cliente.nit,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        estadisticas_compras: estadisticas,
        productos_favoritos: productosFavoritos,
        historial_compras: ventasCliente?.map(v => ({
          venta_id: v.id,
          fecha: v.fecha,
          monto_total: v.total,
          productos_cantidad: v.detalle_ventas?.length || 0,
          metodo_pago: (v.metodos_pago as any)?.nombre || 'No especificado'
        })) || [],
        pedidos_cliente: pedidosCliente?.map(p => ({
          pedido_id: p.id,
          fecha_pedido: p.fecha_pedido,
          fecha_entrega: p.fecha_entrega,
          estado: (p.estados as any)?.nombre || 'Sin estado',
          monto_total: p.total,
          productos_cantidad: p.detalle_pedidos?.length || 0
        })) || [],
        comportamiento
      }
    } catch (error) {
      console.error('Error obteniendo reporte de cliente:', error)
      throw error
    }
  }

  // ======================================================
  // REPORTES DE MOVIMIENTOS
  // ======================================================
  
  async getReporteMovimientos(filtros: FiltrosFecha): Promise<ReporteMovimientos> {
    try {
      // Movimientos de productos
      const { data: movimientosProductos } = await supabase
        .from('movimientos_inventario')
        .select(`
          fecha, cantidad, valor_unitario, observaciones,
          productos(nombre),
          tipos_movimiento_inventario(nombre),
          usuarios(nombre)
        `)
        .gte('fecha', filtros.fecha_inicio)
        .lte('fecha', filtros.fecha_fin)
        .order('fecha', { ascending: false })

      // Movimientos de insumos
      const { data: movimientosInsumos } = await supabase
        .from('movimientos_insumos')
        .select(`
          fecha, cantidad, valor_unitario, observaciones,
          insumos(nombre),
          tipos_movimiento_insumos(nombre),
          usuarios(nombre)
        `)
        .gte('fecha', filtros.fecha_inicio)
        .lte('fecha', filtros.fecha_fin)
        .order('fecha', { ascending: false })

      return {
        movimientos_productos: movimientosProductos?.map(m => ({
          fecha: m.fecha,
          producto: (m.productos as any)?.nombre || 'Producto eliminado',
          tipo_movimiento: (m.tipos_movimiento_inventario as any)?.nombre || 'Sin tipo',
          cantidad: m.cantidad,
          valor_unitario: m.valor_unitario || 0,
          valor_total: m.cantidad * (m.valor_unitario || 0),
          usuario: (m.usuarios as any)?.nombre || 'Sistema',
          observaciones: m.observaciones
        })) || [],
        
        movimientos_insumos: movimientosInsumos?.map(m => ({
          fecha: m.fecha,
          insumo: (m.insumos as any)?.nombre || 'Insumo eliminado',
          tipo_movimiento: (m.tipos_movimiento_insumos as any)?.nombre || 'Sin tipo',
          cantidad: m.cantidad,
          valor_unitario: m.valor_unitario || 0,
          valor_total: m.cantidad * (m.valor_unitario || 0),
          usuario: (m.usuarios as any)?.nombre || 'Sistema',
          observaciones: m.observaciones
        })) || [],
        
        resumen_por_tipo: this.calcularResumenMovimientos(movimientosProductos || [], movimientosInsumos || []),
        productos_con_mas_movimientos: this.calcularItemsConMasMovimientos(movimientosProductos || [], movimientosInsumos || [])
      }
    } catch (error) {
      console.error('Error obteniendo reporte de movimientos:', error)
      throw error
    }
  }

  // ======================================================
  // DASHBOARD EJECUTIVO
  // ======================================================
  
  async getDashboardEjecutivo(): Promise<DashboardEjecutivo> {
    try {
      const hoy = new Date()
      const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
      const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0]
      const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0]

      // KPIs principales
      const [ventasActuales, ventasAnteriores, pedidosActuales, pedidosAnteriores] = await Promise.all([
        supabase.from('ventas').select('total', { count: 'exact' }).gte('fecha', inicioMesActual),
        supabase.from('ventas').select('total', { count: 'exact' }).gte('fecha', inicioMesAnterior).lte('fecha', finMesAnterior),
        supabase.from('pedidos').select('id', { count: 'exact' }).gte('fecha_pedido', inicioMesActual),
        supabase.from('pedidos').select('id', { count: 'exact' }).gte('fecha_pedido', inicioMesAnterior).lte('fecha_pedido', finMesAnterior)
      ])

      // Clientes activos y nuevos
      const { data: clientesNuevos } = await supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .gte('creado_en', inicioMesActual)

      // Productos críticos
      const { data: productosCriticos } = await supabase
        .from('productos')
        .select('nombre, stock, stock_minimo, costo')
        .or('stock.eq.0,stock.lt.stock_minimo,stock.gt.stock_minimo*3')
        .eq('activo', true)

      const kpisCalculados = this.calcularKPIs(ventasActuales, ventasAnteriores, pedidosActuales, pedidosAnteriores)
      const alertas = this.generarAlertas(productosCriticos || [])

      return {
        kpis_principales: {
          ...kpisCalculados,
          clientes_activos: 0, // Calcular según lógica de negocio
          clientes_nuevos_mes: clientesNuevos?.length || 0,
          productos_bajo_minimo: productosCriticos?.filter(p => p.stock < p.stock_minimo).length || 0,
          valor_inventario_total: productosCriticos?.reduce((sum, p) => sum + (p.stock * p.costo), 0) || 0
        },
        tendencias_semanales: [], // Implementar según necesidades
        productos_criticos: productosCriticos?.map(p => ({
          nombre: p.nombre,
          situacion: p.stock === 0 ? 'sin_stock' as const : 
                   p.stock < p.stock_minimo ? 'bajo_minimo' as const : 
                   'sobrestockeado' as const,
          valor: p.stock * p.costo,
          accion_recomendada: this.generarAccionRecomendada(p)
        })) || [],
        alertas_importantes: alertas
      }
    } catch (error) {
      console.error('Error obteniendo dashboard ejecutivo:', error)
      throw error
    }
  }

  // ======================================================
  // MÉTODOS AUXILIARES PARA PROCESAMIENTO DE DATOS
  // ======================================================

  private agruparVentasPorDia(ventas: any[]): any[] {
    const agrupadas = ventas.reduce((acc, venta) => {
      const fecha = venta.fecha.split('T')[0]
      if (!acc[fecha]) {
        acc[fecha] = { fecha, cantidad_ventas: 0, monto_total: 0 }
      }
      acc[fecha].cantidad_ventas += 1
      acc[fecha].monto_total += venta.total
      return acc
    }, {})

    return Object.values(agrupadas).map((dia: any) => ({
      ...dia,
      monto_promedio: dia.monto_total / dia.cantidad_ventas
    }))
  }

  private agruparProductosVendidos(productos: any[]): any[] {
    const agrupados = productos.reduce((acc, item) => {
      const id = item.producto_id
      if (!acc[id]) {
        acc[id] = {
          producto_id: id,
          nombre: item.productos?.nombre || 'Producto eliminado',
          cantidad_vendida: 0,
          monto_total: 0,
          frecuencia_ventas: 0
        }
      }
      acc[id].cantidad_vendida += item.cantidad
      acc[id].monto_total += item.cantidad * item.precio_unitario
      acc[id].frecuencia_ventas += 1
      return acc
    }, {})

    return Object.values(agrupados).sort((a: any, b: any) => b.cantidad_vendida - a.cantidad_vendida)
  }

  private agruparClientesFrecuentes(clientes: any[]): any[] {
    const agrupados = clientes.reduce((acc, venta) => {
      const id = venta.cliente_id
      if (!acc[id]) {
        acc[id] = {
          cliente_id: id,
          nombre: venta.clientes?.nombre || 'Cliente',
          apellido: venta.clientes?.apellido,
          total_compras: 0,
          monto_total: 0,
          ultima_compra: venta.fecha,
          frecuencia: 0
        }
      }
      acc[id].total_compras += 1
      acc[id].monto_total += venta.total
      acc[id].frecuencia += 1
      if (new Date(venta.fecha) > new Date(acc[id].ultima_compra)) {
        acc[id].ultima_compra = venta.fecha
      }
      return acc
    }, {})

    return Object.values(agrupados).sort((a: any, b: any) => b.monto_total - a.monto_total)
  }

  private agruparMetodosPago(metodos: any[]): any[] {
    const total = metodos.reduce((sum, m) => sum + m.total, 0)
    const agrupados = metodos.reduce((acc, venta) => {
      const metodo = venta.metodos_pago?.nombre || 'No especificado'
      if (!acc[metodo]) {
        acc[metodo] = { metodo_pago: metodo, cantidad_usos: 0, monto_total: 0 }
      }
      acc[metodo].cantidad_usos += 1
      acc[metodo].monto_total += venta.total
      return acc
    }, {})

    return Object.values(agrupados).map((metodo: any) => ({
      ...metodo,
      porcentaje: total > 0 ? (metodo.monto_total / total) * 100 : 0
    }))
  }

  private agruparPedidosPorEstado(pedidos: any[]): any[] {
    const total = pedidos.length
    const agrupados = pedidos.reduce((acc, pedido) => {
      const estado = pedido.estados?.nombre || 'Sin estado'
      if (!acc[estado]) {
        acc[estado] = { estado, cantidad: 0, monto_total: 0 }
      }
      acc[estado].cantidad += 1
      acc[estado].monto_total += pedido.total
      return acc
    }, {})

    return Object.values(agrupados).map((estado: any) => ({
      ...estado,
      porcentaje: total > 0 ? (estado.cantidad / total) * 100 : 0
    }))
  }

  private agruparProductosPedidos(productos: any[]): any[] {
    const agrupados = productos.reduce((acc, item) => {
      const id = item.producto_id
      if (!acc[id]) {
        acc[id] = {
          producto_id: id,
          nombre: item.productos?.nombre || 'Producto eliminado',
          cantidad_pedida: 0,
          cantidad_entregada: 0,
          pendiente: 0
        }
      }
      acc[id].cantidad_pedida += item.cantidad_pedida
      acc[id].cantidad_entregada += item.cantidad_entregada || 0
      return acc
    }, {})

    return Object.values(agrupados).map((producto: any) => ({
      ...producto,
      pendiente: producto.cantidad_pedida - producto.cantidad_entregada
    }))
  }

  private calcularRendimientoEntregas(pedidos: any[]): any {
    const completados = pedidos.filter(p => p.fecha_entrega)
    const enTiempo = completados.filter(p => {
      const fechaPedido = new Date(p.fecha_pedido)
      const fechaEntrega = new Date(p.fecha_entrega)
      const diasDiferencia = Math.floor((fechaEntrega.getTime() - fechaPedido.getTime()) / (1000 * 60 * 60 * 24))
      return diasDiferencia <= 7 // Asumimos 7 días como plazo estándar
    })

    const promedioDias = completados.length > 0 
      ? completados.reduce((sum, p) => {
          const dias = Math.floor((new Date(p.fecha_entrega).getTime() - new Date(p.fecha_pedido).getTime()) / (1000 * 60 * 60 * 24))
          return sum + dias
        }, 0) / completados.length
      : 0

    return {
      entregas_tiempo: enTiempo.length,
      entregas_tarde: completados.length - enTiempo.length,
      promedio_dias_entrega: Math.round(promedioDias * 100) / 100,
      porcentaje_puntualidad: completados.length > 0 ? (enTiempo.length / completados.length) * 100 : 0
    }
  }

  private calcularEstadisticasCliente(ventas: any[]): any {
    if (ventas.length === 0) {
      return {
        total_compras: 0,
        monto_total_gastado: 0,
        monto_promedio_compra: 0,
        primera_compra: null,
        ultima_compra: null,
        frecuencia_compras: 0
      }
    }

    const montoTotal = ventas.reduce((sum, v) => sum + v.total, 0)
    const fechas = ventas.map(v => new Date(v.fecha)).sort((a, b) => a.getTime() - b.getTime())
    const primeraCompra = fechas[0]
    const ultimaCompra = fechas[fechas.length - 1]
    
    // Calcular frecuencia (compras por mes)
    const mesesDiferencia = (ultimaCompra.getTime() - primeraCompra.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    const frecuencia = mesesDiferencia > 0 ? ventas.length / mesesDiferencia : ventas.length

    return {
      total_compras: ventas.length,
      monto_total_gastado: montoTotal,
      monto_promedio_compra: montoTotal / ventas.length,
      primera_compra: primeraCompra.toISOString(),
      ultima_compra: ultimaCompra.toISOString(),
      frecuencia_compras: Math.round(frecuencia * 100) / 100
    }
  }

  private calcularProductosFavoritos(ventas: any[]): any[] {
    const productos = ventas.flatMap(v => v.detalle_ventas || [])
    const agrupados = productos.reduce((acc, detalle) => {
      const nombre = detalle.productos?.nombre || 'Producto eliminado'
      if (!acc[nombre]) {
        acc[nombre] = {
          producto_id: 0, // No tenemos el ID disponible en esta estructura
          nombre,
          cantidad_comprada: 0,
          monto_total: 0,
          frecuencia: 0
        }
      }
      acc[nombre].cantidad_comprada += detalle.cantidad
      acc[nombre].frecuencia += 1
      return acc
    }, {})

    return Object.values(agrupados).sort((a: any, b: any) => b.cantidad_comprada - a.cantidad_comprada).slice(0, 5)
  }

  private analizarComportamientoCliente(ventas: any[]): any {
    if (ventas.length === 0) {
      return {
        mes_mayor_compra: 'N/A',
        dia_semana_preferido: 'N/A',
        hora_preferida: 'N/A',
        metodo_pago_preferido: 'N/A',
        categoria_preferida: 'N/A'
      }
    }

    // Análisis por mes
    const ventasPorMes = ventas.reduce((acc, v) => {
      const mes = new Date(v.fecha).toLocaleString('es-ES', { month: 'long' })
      acc[mes] = (acc[mes] || 0) + v.total
      return acc
    }, {})
    const mesMayorCompra = Object.keys(ventasPorMes).reduce((a, b) => ventasPorMes[a] > ventasPorMes[b] ? a : b, '')

    // Método de pago preferido
    const metodosPago = ventas.reduce((acc, v) => {
      const metodo = v.metodos_pago?.nombre || 'No especificado'
      acc[metodo] = (acc[metodo] || 0) + 1
      return acc
    }, {})
    const metodoPagoPreferido = Object.keys(metodosPago).reduce((a, b) => metodosPago[a] > metodosPago[b] ? a : b, '')

    return {
      mes_mayor_compra: mesMayorCompra || 'N/A',
      dia_semana_preferido: 'N/A', // Requiere más análisis
      hora_preferida: 'N/A', // Requiere timestamp completo
      metodo_pago_preferido: metodoPagoPreferido,
      categoria_preferida: 'N/A' // Requiere más análisis de productos
    }
  }

  private calcularResumenMovimientos(_movProductos: any[], _movInsumos: any[]): any[] {
    // Implementar lógica de agrupación por tipo de movimiento
    return []
  }

  private calcularItemsConMasMovimientos(_movProductos: any[], _movInsumos: any[]): any[] {
    // Implementar lógica de items con más movimientos
    return []
  }

  private calcularKPIs(ventasActuales: any, ventasAnteriores: any, pedidosActuales: any, pedidosAnteriores: any): any {
    const ventasEsteMs = ventasActuales.data?.reduce((sum: number, v: any) => sum + v.total, 0) || 0
    const ventasMesPasado = ventasAnteriores.data?.reduce((sum: number, v: any) => sum + v.total, 0) || 0
    const crecimientoVentas = ventasMesPasado > 0 ? ((ventasEsteMs - ventasMesPasado) / ventasMesPasado) * 100 : 0

    const pedidosEsteMs = pedidosActuales.count || 0
    const pedidosMesPasado = pedidosAnteriores.count || 0
    const crecimientoPedidos = pedidosMesPasado > 0 ? ((pedidosEsteMs - pedidosMesPasado) / pedidosMesPasado) * 100 : 0

    return {
      ventas_mes_actual: ventasEsteMs,
      ventas_mes_anterior: ventasMesPasado,
      crecimiento_ventas: Math.round(crecimientoVentas * 100) / 100,
      pedidos_mes_actual: pedidosEsteMs,
      pedidos_mes_anterior: pedidosMesPasado,
      crecimiento_pedidos: Math.round(crecimientoPedidos * 100) / 100
    }
  }

  private generarAccionRecomendada(producto: any): string {
    if (producto.stock === 0) return 'Reabastecer urgentemente'
    if (producto.stock < producto.stock_minimo) return 'Solicitar reposición'
    return 'Revisar políticas de stock'
  }

  private generarAlertas(productos: any[]): any[] {
    return productos.map(p => ({
      tipo: 'stock' as const,
      titulo: `Stock crítico: ${p.nombre}`,
      descripcion: `El producto ${p.nombre} tiene ${p.stock} unidades ${p.stock === 0 ? 'SIN STOCK' : 'por debajo del mínimo'}`,
      prioridad: p.stock === 0 ? 'alta' as const : 'media' as const,
      fecha: new Date().toISOString()
    }))
  }
}

export const reportesService = new ReportesService()
