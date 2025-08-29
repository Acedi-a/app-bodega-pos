import { supabase } from '../lib/supabase'
import { productoService } from './ProductoService'
import type { Perdida, NuevaPerdida, ResumenPerdidas, FiltrosPerdidas } from '../types/perdidas'

class PerdidaService {
  
  // =============================
  // LISTADO Y CONSULTAS
  // =============================
  
  async getPerdidas(
    page: number = 1, 
    limit: number = 50,
    filtros: FiltrosPerdidas = {}
  ): Promise<{
    data: Perdida[]
    total: number
    totalPages: number
    currentPage: number
  }> {
    try {
      let query = supabase
        .from('perdidas')
        .select(`
          *,
          insumos (
            id,
            nombre,
            unidad_medida_id,
            unidades_medida (
              nombre,
              clave
            )
          ),
          productos (
            id,
            nombre,
            precio,
            costo,
            unidad_medida_id,
            unidades_medida (
              nombre,
              clave
            )
          ),
          usuarios (
            id,
            nombre,
            apellido
          )
        `, { count: 'exact' })

      // Aplicar filtros
      if (filtros.tipo_item) {
        query = query.eq('tipo_item', filtros.tipo_item)
      }
      
      if (filtros.fecha_desde) {
        query = query.gte('fecha', filtros.fecha_desde)
      }
      
      if (filtros.fecha_hasta) {
        query = query.lte('fecha', filtros.fecha_hasta + 'T23:59:59')
      }
      
      if (filtros.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id)
      }
      
      if (filtros.producto_id) {
        query = query.eq('producto_id', filtros.producto_id)
      }
      
      if (filtros.insumo_id) {
        query = query.eq('insumo_id', filtros.insumo_id)
      }
      
      if (filtros.motivo) {
        query = query.ilike('motivo', `%${filtros.motivo}%`)
      }

      // Ordenar por fecha más reciente
      query = query.order('fecha', { ascending: false })

      // Paginación
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        data: data || [],
        total: count || 0,
        totalPages,
        currentPage: page
      }
    } catch (error) {
      console.error('Error obteniendo pérdidas:', error)
      throw error
    }
  }

  async getPerdidaById(id: number): Promise<{ data: Perdida | null }> {
    try {
      const { data, error } = await supabase
        .from('perdidas')
        .select(`
          *,
          insumos (
            id,
            nombre,
            stock,
            unidad_medida_id,
            unidades_medida (
              nombre,
              clave
            )
          ),
          productos (
            id,
            nombre,
            precio,
            costo,
            stock,
            unidad_medida_id,
            unidades_medida (
              nombre,
              clave
            )
          ),
          usuarios (
            id,
            nombre,
            apellido
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error('Error obteniendo pérdida:', error)
      throw error
    }
  }

  // =============================
  // RESUMEN Y ESTADÍSTICAS
  // =============================
  
  async getResumenPerdidas(filtros: FiltrosPerdidas = {}): Promise<ResumenPerdidas> {
    try {
      // Construir query base para filtros
      let queryBase = supabase.from('perdidas').select('*')
      
      if (filtros.fecha_desde) {
        queryBase = queryBase.gte('fecha', filtros.fecha_desde)
      }
      
      if (filtros.fecha_hasta) {
        queryBase = queryBase.lte('fecha', filtros.fecha_hasta + 'T23:59:59')
      }
      
      if (filtros.usuario_id) {
        queryBase = queryBase.eq('usuario_id', filtros.usuario_id)
      }

      // Obtener datos para el resumen
      const { data: perdidas, error } = await queryBase

      if (error) throw error

      const totalItems = perdidas?.length || 0
      const valorTotalGeneral = perdidas?.reduce((sum, p) => sum + (Number(p.valor_total) || 0), 0) || 0

      // Separar por tipo
      const productos = perdidas?.filter(p => p.tipo_item === 'producto') || []
      const insumos = perdidas?.filter(p => p.tipo_item === 'insumo') || []

      const perdidasPorTipo = {
        productos: {
          cantidad: productos.length,
          valor: productos.reduce((sum, p) => sum + (Number(p.valor_total) || 0), 0)
        },
        insumos: {
          cantidad: insumos.length,
          valor: insumos.reduce((sum, p) => sum + (Number(p.valor_total) || 0), 0)
        }
      }

      // Top pérdidas (agregadas por item)
      const itemsAgregados = new Map<string, {
        tipo: 'insumo' | 'producto'
        id: number
        nombre: string
        cantidadTotal: number
        valorTotal: number
        frecuencia: number
      }>()

      for (const perdida of perdidas || []) {
        const key = `${perdida.tipo_item}-${perdida.tipo_item === 'producto' ? perdida.producto_id : perdida.insumo_id}`
        
        if (itemsAgregados.has(key)) {
          const existing = itemsAgregados.get(key)!
          existing.cantidadTotal += Number(perdida.cantidad)
          existing.valorTotal += Number(perdida.valor_total || 0)
          existing.frecuencia += 1
        } else {
          // Necesitamos obtener el nombre del producto/insumo
          const nombre = await this.getNombreItem(perdida.tipo_item, perdida.producto_id, perdida.insumo_id)
          itemsAgregados.set(key, {
            tipo: perdida.tipo_item as 'insumo' | 'producto',
            id: (perdida.tipo_item === 'producto' ? perdida.producto_id : perdida.insumo_id)!,
            nombre,
            cantidadTotal: Number(perdida.cantidad),
            valorTotal: Number(perdida.valor_total || 0),
            frecuencia: 1
          })
        }
      }

      const topPerdidas = Array.from(itemsAgregados.values())
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 10)

      return {
        totalItems,
        valorTotalGeneral,
        perdidasPorTipo,
        topPerdidas
      }
    } catch (error) {
      console.error('Error obteniendo resumen de pérdidas:', error)
      throw error
    }
  }

  private async getNombreItem(tipo: string, productoId?: number | null, insumoId?: number | null): Promise<string> {
    try {
      if (tipo === 'producto' && productoId) {
        const { data: producto } = await supabase
          .from('productos')
          .select('nombre')
          .eq('id', productoId)
          .single()
        return producto?.nombre || `Producto #${productoId}`
      } else if (tipo === 'insumo' && insumoId) {
        const { data: insumo } = await supabase
          .from('insumos')
          .select('nombre')
          .eq('id', insumoId)
          .single()
        return insumo?.nombre || `Insumo #${insumoId}`
      }
      return 'Desconocido'
    } catch {
      return tipo === 'producto' ? `Producto #${productoId}` : `Insumo #${insumoId}`
    }
  }

  // =============================
  // CRUD
  // =============================
  
  async crearPerdida(nuevaPerdida: NuevaPerdida): Promise<{ ok: boolean; data?: Perdida; error?: string }> {
    try {
      // Validaciones
      if (!nuevaPerdida.tipo_item || !['insumo', 'producto'].includes(nuevaPerdida.tipo_item)) {
        return { ok: false, error: 'Tipo de item inválido' }
      }
      
      if (nuevaPerdida.cantidad <= 0) {
        return { ok: false, error: 'La cantidad debe ser mayor a 0' }
      }
      
      if (nuevaPerdida.tipo_item === 'producto' && !nuevaPerdida.producto_id) {
        return { ok: false, error: 'Debe especificar un producto' }
      }
      
      if (nuevaPerdida.tipo_item === 'insumo' && !nuevaPerdida.insumo_id) {
        return { ok: false, error: 'Debe especificar un insumo' }
      }

      // Obtener valor unitario automáticamente si no se proporciona
      let valorUnitario = nuevaPerdida.valor_unitario
      if (!valorUnitario) {
        if (nuevaPerdida.tipo_item === 'producto' && nuevaPerdida.producto_id) {
          const { data: producto } = await supabase
            .from('productos')
            .select('costo')
            .eq('id', nuevaPerdida.producto_id)
            .single()
          valorUnitario = Number(producto?.costo || 0)
        } else if (nuevaPerdida.tipo_item === 'insumo' && nuevaPerdida.insumo_id) {
          // Para insumos, no tenemos costo directo, usar 0 o implementar lógica específica
          valorUnitario = 0
        }
      }

      const perdidaData = {
        tipo_item: nuevaPerdida.tipo_item,
        producto_id: nuevaPerdida.producto_id || null,
        insumo_id: nuevaPerdida.insumo_id || null,
        cantidad: nuevaPerdida.cantidad,
        valor_unitario: valorUnitario || null,
        motivo: nuevaPerdida.motivo || null,
        usuario_id: null // TODO: obtener del contexto de autenticación
      }

      const { data, error } = await supabase
        .from('perdidas')
        .insert([perdidaData])
        .select()
        .single()

      if (error) throw error

      // Registrar movimiento de inventario/insumos para reducir stock
      await this.registrarMovimientoPerdida(
        nuevaPerdida.tipo_item,
        nuevaPerdida.producto_id,
        nuevaPerdida.insumo_id,
        nuevaPerdida.cantidad,
        data.id
      )

      return { ok: true, data }
    } catch (error: any) {
      console.error('Error creando pérdida:', error)
      return { ok: false, error: error.message || 'Error desconocido' }
    }
  }

  async actualizarPerdida(id: number, cambios: Partial<NuevaPerdida>): Promise<{ ok: boolean; data?: Perdida; error?: string }> {
    try {
      // Obtener pérdida actual
      const { data: perdidaActual } = await this.getPerdidaById(id)
      if (!perdidaActual) {
        return { ok: false, error: 'Pérdida no encontrada' }
      }

      // Validaciones básicas
      if (cambios.cantidad !== undefined && cambios.cantidad <= 0) {
        return { ok: false, error: 'La cantidad debe ser mayor a 0' }
      }

      const updateData: any = {}
      
      if (cambios.cantidad !== undefined) updateData.cantidad = cambios.cantidad
      if (cambios.valor_unitario !== undefined) updateData.valor_unitario = cambios.valor_unitario
      if (cambios.motivo !== undefined) updateData.motivo = cambios.motivo

      const { data, error } = await supabase
        .from('perdidas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Si cambió la cantidad, ajustar el movimiento de stock
      if (cambios.cantidad !== undefined && cambios.cantidad !== perdidaActual.cantidad) {
        const diferencia = cambios.cantidad - perdidaActual.cantidad
        if (diferencia !== 0) {
          await this.registrarMovimientoPerdida(
            perdidaActual.tipo_item,
            perdidaActual.producto_id,
            perdidaActual.insumo_id,
            diferencia,
            id,
            'Ajuste por modificación de pérdida'
          )
        }
      }

      return { ok: true, data }
    } catch (error: any) {
      console.error('Error actualizando pérdida:', error)
      return { ok: false, error: error.message || 'Error desconocido' }
    }
  }

  async eliminarPerdida(id: number): Promise<{ ok: boolean; error?: string }> {
    try {
      // Obtener datos antes de eliminar para revertir stock
      const { data: perdida } = await this.getPerdidaById(id)
      if (!perdida) {
        return { ok: false, error: 'Pérdida no encontrada' }
      }

      const { error } = await supabase
        .from('perdidas')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Revertir el movimiento de stock (devolver lo que se había quitado)
      await this.registrarMovimientoPerdida(
        perdida.tipo_item,
        perdida.producto_id,
        perdida.insumo_id,
        -perdida.cantidad, // Cantidad negativa para revertir
        id,
        'Reversión por eliminación de pérdida'
      )

      return { ok: true }
    } catch (error: any) {
      console.error('Error eliminando pérdida:', error)
      return { ok: false, error: error.message || 'Error desconocido' }
    }
  }

  // =============================
  // MÉTODOS AUXILIARES
  // =============================

  private async registrarMovimientoPerdida(
    tipoItem: 'insumo' | 'producto',
    productoId: number | null | undefined,
    insumoId: number | null | undefined,
    cantidad: number,
    perdidaId: number,
    nota: string = 'Pérdida registrada'
  ) {
    try {
      if (tipoItem === 'producto' && productoId) {
        // Para productos usar el servicio existente
        await productoService.registrarMovimientoInventario(
          productoId,
          'salida', // La pérdida reduce el stock
          Math.abs(cantidad), // Usar valor absoluto, el tipo 'salida' ya indica reducción
          perdidaId,
          'perdida',
          undefined,
          nota
        )
      } else if (tipoItem === 'insumo' && insumoId) {
        // Para insumos, registrar movimiento directo
        const { data: tipoMovimiento } = await supabase
          .from('tipos_movimiento_insumos')
          .select('id')
          .eq('clave', cantidad > 0 ? 'perdida' : 'entrada') // Si es negativo (reversión), usar entrada
          .single()

        if (!tipoMovimiento) throw new Error('Tipo de movimiento no encontrado')

        // Actualizar stock del insumo
        const { data: insumo } = await supabase
          .from('insumos')
          .select('stock')
          .eq('id', insumoId)
          .single()

        if (!insumo) throw new Error('Insumo no encontrado')

        const nuevoStock = Number(insumo.stock) - cantidad // cantidad ya tiene el signo correcto
        
        const { error: updateError } = await supabase
          .from('insumos')
          .update({ stock: nuevoStock })
          .eq('id', insumoId)

        if (updateError) throw updateError

        // Registrar movimiento
        const { error: movError } = await supabase
          .from('movimientos_insumos')
          .insert({
            insumo_id: insumoId,
            tipo_id: tipoMovimiento.id,
            cantidad: Math.abs(cantidad),
            referencia_tipo: 'perdida',
            referencia_id: perdidaId,
            notas: nota
          })

        if (movError) throw movError
      }
    } catch (error) {
      console.error('Error registrando movimiento de pérdida:', error)
      throw error
    }
  }

  // Obtener usuarios para filtros
  async getUsuarios(): Promise<{ data: Array<{ id: string; nombre: string; apellido?: string }> }> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo usuarios:', error)
      return { data: [] }
    }
  }

  // Obtener productos activos para selección
  async getProductosActivos(): Promise<{ data: Array<{ id: number; nombre: string; precio: number; costo: number }> }> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, costo')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo productos:', error)
      return { data: [] }
    }
  }

  // Obtener insumos activos para selección
  async getInsumosActivos(): Promise<{ data: Array<{ id: number; nombre: string }> }> {
    try {
      const { data, error } = await supabase
        .from('insumos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error

      return { data: data || [] }
    } catch (error) {
      console.error('Error obteniendo insumos:', error)
      return { data: [] }
    }
  }
}

export const perdidaService = new PerdidaService()
