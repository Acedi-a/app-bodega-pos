import { supabase } from '../lib/supabase'
import type {
  TipoMovimientoInsumo,
  InventarioInsumosFilter,
  InventarioInsumosStats,
  GetMovimientosInsumosResponse
} from '../types/inventarioInsumos'

class InventarioInsumosService {
  async getMovimientos(
    page: number = 1,
    limit: number = 20,
    filter: InventarioInsumosFilter = {}
  ): Promise<GetMovimientosInsumosResponse> {
    try {
      let query = supabase
        .from('movimientos_insumos')
        .select(`
          *,
          insumos!insumo_id(
            id,
            nombre,
            stock,
            unidades_medida!unidad_medida_id(
              id,
              nombre,
              clave
            )
          ),
          tipos_movimiento_insumos!tipo_id(
            id,
            clave,
            nombre
          ),
          usuarios!usuario_id(
            id,
            nombre,
            apellido
          )
        `, { count: 'exact' })

      if (filter.search && filter.search.trim() !== '') {
        const s = filter.search.trim()
        query = query.or(`insumos.nombre.ilike.%${s}%,notas.ilike.%${s}%`)
      }
      if (filter.insumo_id) query = query.eq('insumo_id', filter.insumo_id)
      if (filter.tipo_id) query = query.eq('tipo_id', filter.tipo_id)
      if (filter.referencia_tipo) query = query.eq('referencia_tipo', filter.referencia_tipo)
      if (filter.usuario_id) query = query.eq('usuario_id', filter.usuario_id)
      if (filter.fecha_desde) query = query.gte('fecha', filter.fecha_desde)
      if (filter.fecha_hasta) query = query.lte('fecha', filter.fecha_hasta)

      const offset = (page - 1) * limit
      query = query.order('fecha', { ascending: false }).range(offset, offset + limit - 1)

      const { data, error, count } = await query
      if (error) throw error

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
      console.error('Error obteniendo movimientos insumos:', error)
      return {
        data: [],
        count: 0,
        totalPages: 0,
        currentPage: page,
        stats: {
          total_movimientos: 0,
          movimientos_entrada: 0,
          movimientos_salida: 0,
          insumos_afectados: 0
        }
      }
    }
  }

  private async getEstadisticas(filter: InventarioInsumosFilter = {}): Promise<InventarioInsumosStats> {
    try {
      let base = supabase
        .from('movimientos_insumos')
        .select(`
          id,
          insumo_id,
          tipos_movimiento_insumos!tipo_id(
            id,
            clave,
            nombre
          )
        `)

      if (filter.search && filter.search.trim() !== '') {
        const s = filter.search.trim()
        base = base.or(`insumos.nombre.ilike.%${s}%,notas.ilike.%${s}%`)
      }
      if (filter.insumo_id) base = base.eq('insumo_id', filter.insumo_id)
      if (filter.tipo_id) base = base.eq('tipo_id', filter.tipo_id)
      if (filter.referencia_tipo) base = base.eq('referencia_tipo', filter.referencia_tipo)
      if (filter.usuario_id) base = base.eq('usuario_id', filter.usuario_id)
      if (filter.fecha_desde) base = base.gte('fecha', filter.fecha_desde)
      if (filter.fecha_hasta) base = base.lte('fecha', filter.fecha_hasta)

      const { data, error } = await base
      if (error) throw error

      const movimientos = data || []
      const total_movimientos = movimientos.length
      const movimientos_entrada = movimientos.filter(m => (m as any).tipos_movimiento_insumos?.clave === 'entrada').length
      const movimientos_salida = movimientos.filter(m => {
        const clave = (m as any).tipos_movimiento_insumos?.clave
        return clave === 'salida' || clave === 'consumo'
      }).length
      const insumos_afectados = new Set(movimientos.map((m: any) => m.insumo_id)).size

      return { total_movimientos, movimientos_entrada, movimientos_salida, insumos_afectados }
    } catch (error) {
      console.error('Error en estadísticas de insumos:', error)
      return {
        total_movimientos: 0,
        movimientos_entrada: 0,
        movimientos_salida: 0,
        insumos_afectados: 0
      }
    }
  }

  async getTiposMovimiento(): Promise<{ data: TipoMovimientoInsumo[] }> {
    try {
      const { data, error } = await supabase
        .from('tipos_movimiento_insumos')
        .select('*')
        .order('nombre', { ascending: true })
      if (error) throw error
      return { data: data || [] }
    } catch (error) {
      console.error('Error tipos movimiento insumos:', error)
      return { data: [] }
    }
  }

  async getReferenciasUnicas(): Promise<{ data: string[] }> {
    try {
      const { data, error } = await supabase
        .from('movimientos_insumos')
        .select('referencia_tipo')
        .not('referencia_tipo', 'is', null)
      if (error) throw error
      const refs = [...new Set((data || []).map(r => r.referencia_tipo).filter(Boolean))] as string[]
      return { data: refs.sort() }
    } catch (error) {
      console.error('Error referencias insumos:', error)
      return { data: [] }
    }
  }

  async exportarMovimientos(filter: InventarioInsumosFilter = {}): Promise<string> {
    const { data } = await this.getMovimientos(1, 10000, filter)
    let csv = 'Fecha,Insumo,Tipo Movimiento,Cantidad,Referencia,Usuario,Notas\n'
    data.forEach(mov => {
      const fecha = new Date(mov.fecha).toLocaleString('es-ES')
      const insumo = mov.insumos?.nombre || 'N/A'
      const tipo = mov.tipos_movimiento_insumos?.nombre || 'N/A'
      const cantidad = mov.cantidad
      const referencia = mov.referencia_tipo || 'N/A'
      const usuario = mov.usuarios ? `${mov.usuarios.nombre} ${mov.usuarios.apellido || ''}`.trim() : 'N/A'
      const notas = mov.notas || 'N/A'
      csv += `"${fecha}","${insumo}","${tipo}",${cantidad},"${referencia}","${usuario}","${notas}"\n`
    })
    return csv
  }
}

export const inventarioInsumosService = new InventarioInsumosService()
