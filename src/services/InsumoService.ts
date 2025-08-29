import { supabase } from '../lib/supabase'
import type {
  Insumo,
  CreateInsumoData,
  UpdateInsumoData,
  InsumoFilter,
  InsumoStats,
  GetInsumosResponse,
  MovimientoInsumo,
  TipoMovimientoInsumo,
  InsumoReceta,
  InsumoDetailData,
  UnidadMedida
} from '../types/insumos'

class InsumoService {
  // ========================================
  // CRUD BÁSICO
  // ========================================
  
  // Obtener todos los insumos con información relacionada
  async getInsumos(
    page: number = 1, 
    limit: number = 10, 
    filter: InsumoFilter = {}
  ): Promise<GetInsumosResponse> {
    try {
      let query = supabase
        .from('insumos')
        .select(`
          *,
          unidades_medida!unidad_medida_id (
            id,
            clave,
            nombre
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.trim()
        query = query.ilike('nombre', `%${searchTerm}%`)
      }

      if (filter.unidad_medida_id) {
        query = query.eq('unidad_medida_id', filter.unidad_medida_id)
      }

      if (typeof filter.activo === 'boolean') {
        query = query.eq('activo', filter.activo)
      }

      // Paginación y ordenamiento
      const offset = (page - 1) * limit
      query = query
        .order('nombre', { ascending: true })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      let filteredData = data || []

      // Filtro de stock bajo se aplica después de la consulta
      if (filter.stock_bajo) {
        filteredData = filteredData.filter(insumo => 
          insumo.stock <= insumo.stock_minimo
        )
      }

      // Calcular estadísticas
      const stats = await this.getEstadisticas(filter)
      const totalPages = Math.ceil((count || 0) / limit)

      return {
        data: filteredData,
        count: count || 0,
        totalPages,
        currentPage: page,
        stats
      }
    } catch (error) {
      console.error('Error obteniendo insumos:', error)
      return {
        data: [],
        count: 0,
        totalPages: 0,
        currentPage: page,
        stats: {
          total_insumos: 0,
          insumos_activos: 0,
          insumos_stock_bajo: 0,
          valor_total_inventario: 0
        }
      }
    }
  }

  // Obtener un insumo por ID
  async getInsumoById(id: number): Promise<{ data: Insumo | null }> {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select(`
          *,
          unidades_medida!unidad_medida_id (
            id,
            clave,
            nombre
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error('Error obteniendo insumo:', error)
      return { data: null }
    }
  }

  // Crear un nuevo insumo
  async createInsumo(insumoData: CreateInsumoData): Promise<{ data: any, error: any }> {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .insert({
          nombre: insumoData.nombre,
          descripcion: insumoData.descripcion,
          unidad_medida_id: insumoData.unidad_medida_id,
          stock: insumoData.stock || 0,
          stock_minimo: insumoData.stock_minimo || 0,
          foto_url: insumoData.foto_url,
          activo: insumoData.activo ?? true
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creando insumo:', error)
      return { data: null, error }
    }
  }

  // Actualizar un insumo
  async updateInsumo(id: number, insumoData: UpdateInsumoData): Promise<{ data: any, error: any }> {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .update({
          nombre: insumoData.nombre,
          descripcion: insumoData.descripcion,
          unidad_medida_id: insumoData.unidad_medida_id,
          stock: insumoData.stock,
          stock_minimo: insumoData.stock_minimo,
          foto_url: insumoData.foto_url,
          activo: insumoData.activo
        })
        .eq('id', id)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error actualizando insumo:', error)
      return { data: null, error }
    }
  }

  // Eliminar un insumo (soft delete)
  async deleteInsumo(id: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('insumos')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error eliminando insumo:', error)
      return { error }
    }
  }

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  private async getEstadisticas(filter: InsumoFilter = {}): Promise<InsumoStats> {
    try {
      let query = supabase.from('insumos').select('*')

      // Aplicar filtros base
      if (filter.search && filter.search.trim() !== '') {
        query = query.ilike('nombre', `%${filter.search.trim()}%`)
      }

      if (filter.unidad_medida_id) {
        query = query.eq('unidad_medida_id', filter.unidad_medida_id)
      }

      if (typeof filter.activo === 'boolean') {
        query = query.eq('activo', filter.activo)
      }

      const { data, error } = await query

      if (error) throw error

      const insumos = data || []
      const total_insumos = insumos.length
      const insumos_activos = insumos.filter(i => i.activo).length
      const insumos_stock_bajo = insumos.filter(i => i.stock <= i.stock_minimo).length
      const valor_total_inventario = insumos.reduce((acc, i) => acc + (i.stock * 1), 0) // Sin precio, usamos 1

      return {
        total_insumos,
        insumos_activos,
        insumos_stock_bajo,
        valor_total_inventario
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return {
        total_insumos: 0,
        insumos_activos: 0,
        insumos_stock_bajo: 0,
        valor_total_inventario: 0
      }
    }
  }

  // ========================================
  // UNIDADES DE MEDIDA
  // ========================================

  async getUnidadesMedida(): Promise<{ data: UnidadMedida[] }> {
    try {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo unidades de medida:', error)
      return { data: [] }
    }
  }

  // ========================================
  // MOVIMIENTOS DE INSUMOS
  // ========================================

  async getInsumoMovimientos(insumoId: number): Promise<{ data: MovimientoInsumo[] }> {
    try {
      const { data, error } = await supabase
        .from('movimientos_insumos')
        .select(`
          id,
          insumo_id,
          tipo_id,
          cantidad,
          fecha,
          notas,
          referencia_id,
          referencia_tipo,
          creado_en,
          tipos_movimiento_insumos!tipo_id (
            id,
            clave,
            nombre
          ),
          usuarios!usuario_id (
            id,
            nombre,
            apellido
          )
        `)
        .eq('insumo_id', insumoId)
        .order('fecha', { ascending: false })
        .limit(20)

      if (error) throw error

      return { data: data as any || [] }
    } catch (error) {
      console.error('Error obteniendo movimientos:', error)
      return { data: [] }
    }
  }

  async getTiposMovimientoInsumos(): Promise<{ data: TipoMovimientoInsumo[] }> {
    try {
      const { data, error } = await supabase
        .from('tipos_movimiento_insumos')
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
  // RECETAS (productos que usan este insumo)
  // ========================================

  async getInsumoRecetas(insumoId: number): Promise<{ data: InsumoReceta[] }> {
    try {
      const { data, error } = await supabase
        .from('receta_insumos')
        .select(`
          id,
          producto_id,
          insumo_id,
          cantidad_por_unidad,
          obligatorio,
          creado_en,
          productos!producto_id (
            id,
            nombre,
            sku,
            precio
          )
        `)
        .eq('insumo_id', insumoId)
        .order('obligatorio', { ascending: false })

      if (error) throw error

      return { data: data as any || [] }
    } catch (error) {
      console.error('Error obteniendo recetas:', error)
      return { data: [] }
    }
  }

  // ========================================
  // DETALLE COMPLETO DE INSUMO
  // ========================================

  async getInsumoDetail(insumoId: number): Promise<{ data: InsumoDetailData | null }> {
    try {
      const [
        { data: insumo },
        { data: movimientos },
        { data: recetas }
      ] = await Promise.all([
        this.getInsumoById(insumoId),
        this.getInsumoMovimientos(insumoId),
        this.getInsumoRecetas(insumoId)
      ])

      if (!insumo) {
        return { data: null }
      }

      // Calcular estadísticas adicionales
      const total_consumido = movimientos
        .filter(m => m.tipos_movimiento_insumos?.clave === 'consumo' || m.tipos_movimiento_insumos?.clave === 'salida')
        .reduce((acc, m) => acc + m.cantidad, 0)

      const total_recibido = movimientos
        .filter(m => m.tipos_movimiento_insumos?.clave === 'entrada')
        .reduce((acc, m) => acc + m.cantidad, 0)

      const estadisticas = {
        total_consumido,
        total_recibido,
        movimientos_recientes: movimientos.length,
        productos_asociados: recetas.length
      }

      return {
        data: {
          insumo,
          movimientos,
          recetas,
          estadisticas
        }
      }
    } catch (error) {
      console.error('Error obteniendo detalle del insumo:', error)
      return { data: null }
    }
  }

  // ========================================
  // BÚSQUEDA PARA SELECCIONAR EN FORMULARIOS
  // ========================================

  async buscarInsumosParaReceta(search: string): Promise<{ data: Insumo[] }> {
    try {
      let query = supabase
        .from('insumos')
        .select(`
          id,
          nombre,
          stock,
          stock_minimo,
          unidades_medida!unidad_medida_id (
            nombre
          )
        `)
        .eq('activo', true)
        .order('nombre', { ascending: true })
        .limit(20)

      if (search.trim()) {
        query = query.ilike('nombre', `%${search.trim()}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return { data: data as any || [] }
    } catch (error) {
      console.error('Error buscando insumos:', error)
      return { data: [] }
    }
  }

  // ========================================
  // ACTUALIZAR STOCK
  // ========================================

  async actualizarStock(insumoId: number, nuevaCantidad: number, motivo: string = ''): Promise<{ error: any }> {
    try {
      // Obtener stock actual
      const { data: insumo, error: getError } = await supabase
        .from('insumos')
        .select('stock')
        .eq('id', insumoId)
        .single()

      if (getError) throw getError

      const stockAnterior = insumo.stock
      const diferencia = nuevaCantidad - stockAnterior

      // Actualizar stock en insumos
      const { error: updateError } = await supabase
        .from('insumos')
        .update({ stock: nuevaCantidad })
        .eq('id', insumoId)

      if (updateError) throw updateError

      // Registrar movimiento
      // Obtener ID del tipo de movimiento
      const { data: tipoData, error: tipoError } = await supabase
        .from('tipos_movimiento_insumos')
        .select('id')
        .eq('clave', 'ajuste') // Usamos ajuste para cambios manuales
        .single()

      if (tipoError) throw tipoError

      const { error: movimientoError } = await supabase
        .from('movimientos_insumos')
        .insert({
          insumo_id: insumoId,
          tipo_id: tipoData.id,
          cantidad: Math.abs(diferencia),
          notas: motivo,
          referencia_tipo: 'ajuste_manual'
        })

      if (movimientoError) throw movimientoError

      return { error: null }
    } catch (error) {
      console.error('Error actualizando stock:', error)
      return { error }
    }
  }

  // ========================================
  // INSUMOS CON STOCK BAJO
  // ========================================

  async getInsumosStockBajo(): Promise<{ data: Insumo[] }> {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select(`
          *,
          unidades_medida!unidad_medida_id (
            id,
            clave,
            nombre
          )
        `)
        .eq('activo', true)
        .order('stock', { ascending: true })

      if (error) throw error

      // Filtrar insumos con stock bajo en el cliente
      const insumosStockBajo = data?.filter(insumo => 
        insumo.stock <= (insumo.stock_minimo || 0)
      ) || []

      return { data: insumosStockBajo }
    } catch (error) {
      console.error('Error obteniendo insumos con stock bajo:', error)
      return { data: [] }
    }
  }
}

export const insumoService = new InsumoService()
