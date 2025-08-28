import { supabase } from '../lib/supabase'
import type {
  Venta,
  CreateVentaData,
  UpdateVentaData,
  VentaFilter,
  VentaStats,
  GetVentasResponse,
  MetodoPago,
  EstadoVenta,
  Cliente
} from '../types/ventas'

class VentaService {
  // ========================================
  // CRUD BÁSICO
  // ========================================
  
  // Obtener todas las ventas con información relacionada
  async getVentas(
    page: number = 1, 
    limit: number = 10, 
    filter: VentaFilter = {}
  ): Promise<GetVentasResponse> {
    try {
      let query = supabase
        .from('ventas')
        .select(`
          *,
          terceros!tercero_id (
            id,
            nombre,
            nit,
            email,
            telefono
          ),
          usuarios!usuario_id (
            id,
            nombre,
            apellido
          ),
          pedidos!pedido_id (
            id,
            fecha_pedido,
            notas
          ),
          metodos_pago!metodo_pago_id (
            id,
            clave,
            nombre
          ),
          estados!estado_id (
            id,
            categoria,
            clave,
            nombre
          ),
          venta_items (
            id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            productos!producto_id (
              id,
              nombre,
              sku,
              precio,
              stock,
              unidades_medida!unidad_medida_id (
                id,
                nombre,
                clave
              )
            )
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.trim()
        // Buscar por ID de venta, nombre de cliente o notas
        query = query.or(`id.eq.${searchTerm},terceros.nombre.ilike.%${searchTerm}%,notas.ilike.%${searchTerm}%`)
      }

      if (filter.tercero_id) {
        query = query.eq('tercero_id', filter.tercero_id)
      }

      if (filter.usuario_id) {
        query = query.eq('usuario_id', filter.usuario_id)
      }

      if (filter.metodo_pago_id) {
        query = query.eq('metodo_pago_id', filter.metodo_pago_id)
      }

      if (filter.estado_id) {
        query = query.eq('estado_id', filter.estado_id)
      }

      if (filter.fecha_desde) {
        query = query.gte('fecha', filter.fecha_desde)
      }

      if (filter.fecha_hasta) {
        query = query.lte('fecha', filter.fecha_hasta)
      }

      if (filter.monto_min !== undefined) {
        query = query.gte('monto_total', filter.monto_min)
      }

      if (filter.monto_max !== undefined) {
        query = query.lte('monto_total', filter.monto_max)
      }

      // Paginación y ordenamiento
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .order('fecha', { ascending: false })
        .range(from, to)

      if (error) throw error

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / limit)

      return {
        data: data || [],
        totalPages,
        currentPage: page,
        totalCount
      }
    } catch (error) {
      console.error('Error obteniendo ventas:', error)
      return {
        data: [],
        totalPages: 0,
        currentPage: page,
        totalCount: 0
      }
    }
  }

  // Obtener una venta por ID
  async getVentaById(id: number): Promise<{ data: Venta | null, error?: any }> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          terceros!tercero_id (
            id,
            nombre,
            nit,
            email,
            telefono
          ),
          usuarios!usuario_id (
            id,
            nombre,
            apellido
          ),
          pedidos!pedido_id (
            id,
            fecha_pedido,
            notas
          ),
          metodos_pago!metodo_pago_id (
            id,
            clave,
            nombre
          ),
          estados!estado_id (
            id,
            categoria,
            clave,
            nombre
          ),
          venta_items (
            id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            creado_en,
            productos!producto_id (
              id,
              nombre,
              sku,
              descripcion,
              precio,
              stock,
              unidades_medida!unidad_medida_id (
                id,
                nombre,
                clave
              )
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error('Error obteniendo venta:', error)
      return { data: null, error }
    }
  }

  // Método simplificado para obtener una venta (usado en el modal)
  async getVenta(id: number): Promise<Venta | null> {
    const { data } = await this.getVentaById(id)
    return data
  }

  // Crear una nueva venta
  async createVenta(ventaData: CreateVentaData): Promise<{ data: any, error: any }> {
    try {
      // Iniciar transacción
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          tercero_id: ventaData.tercero_id,
          usuario_id: ventaData.usuario_id,
          pedido_id: ventaData.pedido_id,
          fecha: ventaData.fecha || new Date().toISOString(),
          monto_total: ventaData.monto_total,
          descuento: ventaData.descuento,
          impuesto: ventaData.impuesto,
          metodo_pago_id: ventaData.metodo_pago_id,
          estado_id: ventaData.estado_id,
          notas: ventaData.notas
        })
        .select()
        .single()

      if (ventaError) throw ventaError

      // Insertar items de venta
      if (ventaData.items && ventaData.items.length > 0) {
        const items = ventaData.items.map(item => ({
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        }))

        const { error: itemsError } = await supabase
          .from('venta_items')
          .insert(items)

        if (itemsError) throw itemsError

        // TODO: Aquí se podría agregar lógica para actualizar inventario automáticamente
        // creando movimientos_inventario con tipo 'salida'
      }

      return { data: venta, error: null }
    } catch (error) {
      console.error('Error creando venta:', error)
      return { data: null, error }
    }
  }

  // Actualizar una venta
  async updateVenta(id: number, ventaData: UpdateVentaData) {
    try {
      console.log('🔧 Actualizando venta en DB:', {
        ventaId: id,
        itemsCount: ventaData.items?.length || 0,
        items: ventaData.items?.map(item => ({
          id: item.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          isNew: !item.id
        }))
      })

      // Actualizar datos principales de la venta
      const { data, error } = await supabase
        .from('ventas')
        .update({
          tercero_id: ventaData.tercero_id,
          fecha: ventaData.fecha,
          monto_total: ventaData.monto_total,
          descuento: ventaData.descuento,
          impuesto: ventaData.impuesto,
          metodo_pago_id: ventaData.metodo_pago_id,
          estado_id: ventaData.estado_id,
          notas: ventaData.notas
        })
        .eq('id', id)
        .select()

      if (error) throw error

      // Actualizar items si se proporcionan
      if (ventaData.items) {
        // ESTRATEGIA: Reemplazar todos los items para evitar duplicados
        
        console.log('🗑️ Eliminando todos los items existentes de venta_id:', id)
        
        // 1. Primero eliminar todos los items existentes
        const { error: deleteError } = await supabase
          .from('venta_items')
          .delete()
          .eq('venta_id', id)

        if (deleteError) {
          console.error('Error eliminando items:', deleteError)
          throw deleteError
        }

        // 2. Insertar todos los items nuevos
        if (ventaData.items.length > 0) {
          const itemsToInsert = ventaData.items.map(item => ({
            venta_id: id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          }))

          console.log('➕ Insertando nuevos items:', itemsToInsert)

          const { error: itemsError } = await supabase
            .from('venta_items')
            .insert(itemsToInsert)

          if (itemsError) {
            console.error('Error insertando items:', itemsError)
            throw itemsError
          }
        }
      }

      console.log('✅ Venta actualizada exitosamente')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error actualizando venta:', error)
      return { data: null, error }
    }
  }

  // Eliminar una venta (soft delete cambiando estado)
  async deleteVenta(id: number) {
    try {
      // En lugar de eliminar, cambiar a estado 'cancelada'
      const { data: estadoCancelado } = await supabase
        .from('estados')
        .select('id')
        .eq('categoria', 'venta')
        .eq('clave', 'cancelada')
        .single()

      if (estadoCancelado) {
        const { data, error } = await supabase
          .from('ventas')
          .update({ estado_id: estadoCancelado.id })
          .eq('id', id)
          .select()

        if (error) throw error
        return { data, error: null }
      } else {
        throw new Error('Estado "cancelada" no encontrado')
      }
    } catch (error) {
      console.error('Error eliminando venta:', error)
      return { data: null, error }
    }
  }

  // ========================================
  // ESTADÍSTICAS
  // ========================================
  
  async getVentaStats(): Promise<{ data: VentaStats }> {
    try {
      const hoy = new Date()
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()))
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

      // Estadísticas generales
      const [
        totalVentas,
        ventasHoy,
        ventasSemana,
        ventasMes,
        ventasPorEstado,
        ventasPorMetodoPago,
        productosPopulares
      ] = await Promise.all([
        // Total de ventas
        supabase
          .from('ventas')
          .select('id', { count: 'exact', head: true }),

        // Ventas de hoy
        supabase
          .from('ventas')
          .select('id, monto_total', { count: 'exact' })
          .gte('fecha', inicioHoy.toISOString()),

        // Ventas de la semana
        supabase
          .from('ventas')
          .select('id, monto_total', { count: 'exact' })
          .gte('fecha', inicioSemana.toISOString()),

        // Ventas del mes
        supabase
          .from('ventas')
          .select('id, monto_total', { count: 'exact' })
          .gte('fecha', inicioMes.toISOString()),

        // Ventas por estado
        supabase
          .from('ventas')
          .select(`
            estado_id,
            monto_total,
            estados!estado_id (
              nombre
            )
          `),

        // Ventas por método de pago
        supabase
          .from('ventas')
          .select(`
            metodo_pago_id,
            monto_total,
            metodos_pago!metodo_pago_id (
              nombre
            )
          `),

        // Productos más vendidos
        supabase
          .from('venta_items')
          .select(`
            producto_id,
            cantidad,
            subtotal,
            productos!producto_id (
              nombre
            )
          `)
          .limit(10)
      ])

      // Calcular montos
      const montoTotalHoy = ventasHoy.data?.reduce((sum, v) => sum + (v.monto_total || 0), 0) || 0
      const montoTotalSemana = ventasSemana.data?.reduce((sum, v) => sum + (v.monto_total || 0), 0) || 0
      const montoTotalMes = ventasMes.data?.reduce((sum, v) => sum + (v.monto_total || 0), 0) || 0

      // Procesar ventas por estado
      const estadosMap = new Map()
      ventasPorEstado.data?.forEach((venta: any) => {
        const estado = venta.estados?.nombre || 'Sin estado'
        const current = estadosMap.get(estado) || { count: 0, monto: 0 }
        estadosMap.set(estado, {
          count: current.count + 1,
          monto: current.monto + (venta.monto_total || 0)
        })
      })

      // Procesar ventas por método de pago
      const metodosMap = new Map()
      ventasPorMetodoPago.data?.forEach((venta: any) => {
        const metodo = venta.metodos_pago?.nombre || 'Sin método'
        const current = metodosMap.get(metodo) || { count: 0, monto: 0 }
        metodosMap.set(metodo, {
          count: current.count + 1,
          monto: current.monto + (venta.monto_total || 0)
        })
      })

      // Procesar productos populares
      const productosMap = new Map()
      productosPopulares.data?.forEach((item: any) => {
        const producto = item.productos?.nombre || 'Sin nombre'
        const current = productosMap.get(producto) || { cantidad: 0, ingresos: 0 }
        productosMap.set(producto, {
          cantidad: current.cantidad + (item.cantidad || 0),
          ingresos: current.ingresos + (item.subtotal || 0)
        })
      })

      const stats: VentaStats = {
        totalVentas: totalVentas.count || 0,
        ventasHoy: ventasHoy.count || 0,
        ventasSemana: ventasSemana.count || 0,
        ventasMes: ventasMes.count || 0,
        montoTotalHoy,
        montoTotalSemana,
        montoTotalMes,
        ventasPorEstado: Array.from(estadosMap.entries()).map(([estado, data]) => ({
          estado,
          count: data.count,
          monto: data.monto
        })),
        ventasPorMetodoPago: Array.from(metodosMap.entries()).map(([metodo, data]) => ({
          metodo,
          count: data.count,
          monto: data.monto
        })),
        productosPopulares: Array.from(productosMap.entries())
          .map(([producto, data]) => ({
            producto,
            cantidad: data.cantidad,
            ingresos: data.ingresos
          }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 10)
      }

      return { data: stats }
    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error)
      return {
        data: {
          totalVentas: 0,
          ventasHoy: 0,
          ventasSemana: 0,
          ventasMes: 0,
          montoTotalHoy: 0,
          montoTotalSemana: 0,
          montoTotalMes: 0,
          ventasPorEstado: [],
          ventasPorMetodoPago: [],
          productosPopulares: []
        }
      }
    }
  }

  // ========================================
  // CATÁLOGOS AUXILIARES
  // ========================================

  async getMetodosPago(): Promise<{ data: MetodoPago[] }> {
    try {
      const { data, error } = await supabase
        .from('metodos_pago')
        .select('id, clave, nombre')
        .order('nombre')

      if (error) throw error
      //console.log("metodos: ", data)

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo métodos de pago:', error)
      return { data: [] }
    }
  }

  async getEstadosVenta(): Promise<{ data: EstadoVenta[] }> {
    try {
      const { data, error } = await supabase
        .from('estados')
        .select('id, categoria, clave, nombre')
        .eq('categoria', 'venta')
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo estados de venta:', error)
      return { data: [] }
    }
  }

  // Obtener ID del estado por defecto para ventas completadas
  async getEstadoCompletadaId(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('estados')
        .select('id')
        .eq('categoria', 'venta')
        .eq('clave', 'completada')
        .single()

      if (error) throw error
      return data?.id || 1 // fallback a 1 si no encuentra
    } catch (error) {
      console.error('Error obteniendo estado completada:', error)
      return 1 // fallback
    }
  }

  async getClientes(): Promise<{ data: Cliente[] }> {
    try {
      const { data, error } = await supabase
        .from('terceros')
        .select(`
          id,
          nombre,
          nit,
          email,
          telefono,
          tipos_tercero!tipo_id (
            clave
          )
        `)
        .eq('tipos_tercero.clave', 'cliente')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo clientes:', error)
      return { data: [] }
    }
  }

  // ========================================
  // BÚSQUEDA DE PRODUCTOS PARA VENTA
  // ========================================

  async buscarProductosParaVenta(search: string): Promise<{ data: any[] }> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          sku,
          precio,
          stock,
          descripcion,
          unidades_medida!unidad_medida_id (
            id,
            nombre,
            clave
          )
        `)
        .eq('activo', true)
        .gt('stock', 0)
        .or(`nombre.ilike.%${search}%,sku.ilike.%${search}%`)
        .order('nombre')
        .limit(20)

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error buscando productos:', error)
      return { data: [] }
    }
  }
}

export const ventaService = new VentaService()
