import { supabase } from '../lib/supabase'
import type { 
  Proveedor, 
  CreateProveedorData, 
  UpdateProveedorData, 
  ProveedorStats,
  ProveedorCompra,
  GetProveedoresResponse 
} from '../types/proveedores'

class ProveedorService {
  // Obtener todos los proveedores con información adicional
  async getProveedores(page: number = 1, limit: number = 10, search: string = ''): Promise<GetProveedoresResponse> {
    try {
      let query = supabase
        .from('terceros')
        .select(`
          *,
          proveedor_info (*)
        `)
        .eq('tipo_id', 2) // tipo_id = 2 para proveedores

      // Aplicar filtro de búsqueda si existe
      if (search.trim()) {
        query = query.or(`nombre.ilike.%${search}%,nit.ilike.%${search}%,ci.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`)
      }

      // Contar total de registros
      const countQuery = supabase
        .from('terceros')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_id', 2)
      
      if (search.trim()) {
        countQuery.or(`nombre.ilike.%${search}%,nit.ilike.%${search}%,ci.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`)
      }
      
      const { count } = await countQuery
      
      // Obtener datos paginados
      const { data, error } = await query
        .order('nombre', { ascending: true })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        data: data as Proveedor[],
        totalPages,
        currentPage: page,
        totalCount: count || 0
      }
    } catch (error) {
      console.error('Error obteniendo proveedores:', error)
      return {
        data: [],
        totalPages: 0,
        currentPage: 1,
        totalCount: 0
      }
    }
  }

  // Obtener un proveedor por ID
  async getProveedorById(id: number): Promise<{ data: Proveedor | null, error?: any }> {
    try {
      const { data, error } = await supabase
        .from('terceros')
        .select(`
          *,
          proveedor_info (*)
        `)
        .eq('id', id)
        .eq('tipo_id', 2)
        .single()

      if (error) throw error

      return { data: data as Proveedor }
    } catch (error) {
      console.error('Error obteniendo proveedor:', error)
      return { data: null, error }
    }
  }

  // Crear un nuevo proveedor
  async createProveedor(proveedorData: CreateProveedorData): Promise<{ data: any, error: any }> {
    try {
      // Crear el tercero
      const { data: tercero, error: terceroError } = await supabase
        .from('terceros')
        .insert({
          nombre: proveedorData.nombre,
          nit: proveedorData.nit,
          ci: proveedorData.ci,
          email: proveedorData.email,
          telefono: proveedorData.telefono,
          direccion: proveedorData.direccion,
          tipo_id: 2, // tipo_id = 2 para proveedores
          activo: true
        })
        .select()
        .single()

      if (terceroError) throw terceroError

      // Crear la información específica del proveedor
      const { error: proveedorInfoError } = await supabase
        .from('proveedor_info')
        .insert({
          tercero_id: tercero.id,
          contacto: proveedorData.contacto,
          condicion_pago: proveedorData.condicion_pago
        })

      if (proveedorInfoError) throw proveedorInfoError

      return { data: tercero, error: null }
    } catch (error) {
      console.error('Error creando proveedor:', error)
      return { data: null, error }
    }
  }

  // Actualizar un proveedor
  async updateProveedor(id: number, proveedorData: UpdateProveedorData) {
    try {
      // Actualizar el tercero
      const { data: tercero, error: terceroError } = await supabase
        .from('terceros')
        .update({
          nombre: proveedorData.nombre,
          nit: proveedorData.nit,
          ci: proveedorData.ci,
          email: proveedorData.email,
          telefono: proveedorData.telefono,
          direccion: proveedorData.direccion,
          activo: proveedorData.activo
        })
        .eq('id', id)
        .select()
        .single()

      if (terceroError) throw terceroError

      // Actualizar la información específica del proveedor
      const { error: proveedorInfoError } = await supabase
        .from('proveedor_info')
        .upsert({
          tercero_id: id,
          contacto: proveedorData.contacto,
          condicion_pago: proveedorData.condicion_pago
        })

      if (proveedorInfoError) throw proveedorInfoError

      return { data: tercero, error: null }
    } catch (error) {
      console.error('Error actualizando proveedor:', error)
      return { data: null, error }
    }
  }

  // Eliminar un proveedor (soft delete)
  async deleteProveedor(id: number) {
    try {
      const { error } = await supabase
        .from('terceros')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error eliminando proveedor:', error)
      return { error }
    }
  }

  // Obtener estadísticas de proveedores
  async getProveedorStats(): Promise<{ data: ProveedorStats }> {
    try {
      // Total de proveedores
      const { count: totalProveedores } = await supabase
        .from('terceros')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_id', 2)
        .eq('activo', true)

      // Proveedores nuevos este mes
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      const { count: nuevosEsteMes } = await supabase
        .from('terceros')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_id', 2)
        .eq('activo', true)
        .gte('creado_en', inicioMes.toISOString())

      // Total de compras (placeholder - implementar cuando tengas tabla de compras)
      const totalCompras = 0

      const stats: ProveedorStats = {
        totalProveedores: totalProveedores || 0,
        proveedoresActivos: totalProveedores || 0,
        nuevosEsteMes: nuevosEsteMes || 0,
        totalCompras,
        promedioEntrega: 7 // Días promedio de entrega por defecto
      }

      return { data: stats }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw error
    }
  }

  // Obtener historial de compras de un proveedor
  async getProveedorCompras(_proveedorId: string): Promise<{ data: ProveedorCompra[] }> {
    try {
      // Placeholder - implementar cuando tengas tabla de compras
      // Por ahora devolvemos datos de ejemplo
      const comprasEjemplo: ProveedorCompra[] = [
        {
          id: 1,
          fecha: new Date().toISOString(),
          monto_total: 2500,
          estado: 'Completada',
          productos_count: 12
        },
        {
          id: 2,
          fecha: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          monto_total: 1800,
          estado: 'Completada',
          productos_count: 8
        }
      ]

      return { data: comprasEjemplo }
    } catch (error) {
      console.error('Error obteniendo compras del proveedor:', error)
      return { data: [] }
    }
  }

  // Actualizar calificación de un proveedor
  async updateCalificacionProveedor(proveedorId: number, calificacion: number) {
    try {
      const { error } = await supabase
        .from('proveedor_info')
        .upsert({
          tercero_id: proveedorId,
          calificacion: Math.max(1, Math.min(5, calificacion))
        })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error actualizando calificación:', error)
      return { error }
    }
  }
}

export const proveedorService = new ProveedorService()
