import { supabase } from '../lib/supabase'
import type {
  TipoMovimientoInventario,
  InventarioFilter,
  InventarioStats,
  GetMovimientosInventarioResponse
} from '../types/inventario'

class InventarioService {
  
  // ========================================
  // OBTENER MOVIMIENTOS CON FILTROS
  // ========================================
  
  async getMovimientos(
    page: number = 1, 
    limit: number = 20, 
    filter: InventarioFilter = {}
  ): Promise<GetMovimientosInventarioResponse> {
    try {
      let query = supabase
        .from('movimientos_inventario')
        .select(`
          *,
          productos!producto_id (
            id,
            nombre,
            sku,
            precio,
            stock
          ),
          tipos_movimiento_inventario!tipo_id (
            id,
            clave,
            nombre,
            incrementa_stock
          ),
          usuarios!usuario_id (
            id,
            nombre,
            apellido
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.trim()
        // Buscar por nombre de producto o SKU
        query = query.or(`productos.nombre.ilike.%${searchTerm}%,productos.sku.ilike.%${searchTerm}%,notas.ilike.%${searchTerm}%`)
      }

      if (filter.producto_id) {
        query = query.eq('producto_id', filter.producto_id)
      }

      if (filter.tipo_id) {
        query = query.eq('tipo_id', filter.tipo_id)
      }

      if (filter.referencia_tipo) {
        query = query.eq('referencia_tipo', filter.referencia_tipo)
      }

      if (filter.usuario_id) {
        query = query.eq('usuario_id', filter.usuario_id)
      }

      if (filter.fecha_desde) {
        query = query.gte('fecha', filter.fecha_desde)
      }

      if (filter.fecha_hasta) {
        query = query.lte('fecha', filter.fecha_hasta)
      }

      // Paginación y ordenamiento
      const offset = (page - 1) * limit
      query = query
        .order('fecha', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Obtener estadísticas
      const stats = await this.getEstadisticas(filter)

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        data: data || [],
        count: count || 0,
        totalPages,
        currentPage: page,
        stats
      }
    } catch (error) {
      console.error('Error obteniendo movimientos:', error)
      return {
        data: [],
        count: 0,
        totalPages: 0,
        currentPage: page,
        stats: {
          total_movimientos: 0,
          movimientos_entrada: 0,
          movimientos_salida: 0,
          productos_afectados: 0
        }
      }
    }
  }

  // ========================================
  // ESTADÍSTICAS DE INVENTARIO
  // ========================================

  private async getEstadisticas(filter: InventarioFilter = {}): Promise<InventarioStats> {
    try {
      // Query base para las estadísticas
      let baseQuery = supabase
        .from('movimientos_inventario')
        .select(`
          id,
          producto_id,
          tipos_movimiento_inventario!tipo_id(
            id,
            clave,
            nombre,
            incrementa_stock
          )
        `)

      // Aplicar los mismos filtros que en la consulta principal
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.trim()
        baseQuery = baseQuery.or(`productos.nombre.ilike.%${searchTerm}%,productos.sku.ilike.%${searchTerm}%,notas.ilike.%${searchTerm}%`)
      }

      if (filter.producto_id) {
        baseQuery = baseQuery.eq('producto_id', filter.producto_id)
      }

      if (filter.tipo_id) {
        baseQuery = baseQuery.eq('tipo_id', filter.tipo_id)
      }

      if (filter.referencia_tipo) {
        baseQuery = baseQuery.eq('referencia_tipo', filter.referencia_tipo)
      }

      if (filter.usuario_id) {
        baseQuery = baseQuery.eq('usuario_id', filter.usuario_id)
      }

      if (filter.fecha_desde) {
        baseQuery = baseQuery.gte('fecha', filter.fecha_desde)
      }

      if (filter.fecha_hasta) {
        baseQuery = baseQuery.lte('fecha', filter.fecha_hasta)
      }

      const { data, error } = await baseQuery

      if (error) throw error

      const movimientos = data || []
      const total_movimientos = movimientos.length
      
      const movimientos_entrada = movimientos.filter(m => 
        (m.tipos_movimiento_inventario as any)?.incrementa_stock === true
      ).length
      
      const movimientos_salida = movimientos.filter(m => 
        (m.tipos_movimiento_inventario as any)?.incrementa_stock === false
      ).length

      const productos_afectados = new Set(movimientos.map(m => m.producto_id)).size

      return {
        total_movimientos,
        movimientos_entrada,
        movimientos_salida,
        productos_afectados
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return {
        total_movimientos: 0,
        movimientos_entrada: 0,
        movimientos_salida: 0,
        productos_afectados: 0
      }
    }
  }

  // ========================================
  // OBTENER TIPOS DE MOVIMIENTO
  // ========================================

  async getTiposMovimiento(): Promise<{ data: TipoMovimientoInventario[] }> {
    try {
      const { data, error } = await supabase
        .from('tipos_movimiento_inventario')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo tipos de movimiento:', error)
      return { data: [] }
    }
  }

  // ========================================
  // OBTENER REFERENCIAS ÚNICAS
  // ========================================

  async getReferenciasUnicas(): Promise<{ data: string[] }> {
    try {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select('referencia_tipo')
        .not('referencia_tipo', 'is', null)

      if (error) throw error

      const referencias = [...new Set(data?.map(item => item.referencia_tipo).filter(Boolean))] as string[]
      
      return { data: referencias.sort() }
    } catch (error) {
      console.error('Error obteniendo referencias:', error)
      return { data: [] }
    }
  }

  // ========================================
  // EXPORTAR MOVIMIENTOS (CSV)
  // ========================================

  async exportarMovimientos(filter: InventarioFilter = {}): Promise<string> {
    try {
      // Obtener todos los movimientos sin paginación para exportar
      const { data: movimientos } = await this.getMovimientos(1, 10000, filter)

      let csv = 'Fecha,Producto,SKU,Tipo Movimiento,Cantidad,Referencia,Usuario,Notas\n'

      movimientos.forEach(mov => {
        const fecha = new Date(mov.fecha).toLocaleString('es-ES')
        const producto = mov.productos?.nombre || 'N/A'
        const sku = mov.productos?.sku || 'N/A'
        const tipo = mov.tipos_movimiento_inventario?.nombre || 'N/A'
        const cantidad = mov.cantidad
        const referencia = mov.referencia_tipo || 'N/A'
        const usuario = mov.usuarios ? `${mov.usuarios.nombre} ${mov.usuarios.apellido || ''}`.trim() : 'N/A'
        const notas = mov.notas || 'N/A'

        csv += `"${fecha}","${producto}","${sku}","${tipo}",${cantidad},"${referencia}","${usuario}","${notas}"\n`
      })

      return csv
    } catch (error) {
      console.error('Error exportando movimientos:', error)
      throw error
    }
  }
}

export const inventarioService = new InventarioService()
