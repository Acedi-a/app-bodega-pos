import { supabase } from '../lib/supabase'
import type { Cliente, CreateClienteData, UpdateClienteData, ClienteStats, ClienteVenta } from '../types/clientes'

class ClienteService {
  // Obtener todos los clientes con paginación
  async getClientes(page = 1, limit = 10, search = '') {
    try {
      let query = supabase
        .from('terceros')
        .select(`
          *,
          tipos_tercero (
            id,
            clave,
            nombre
          ),
          cliente_info (
            tercero_id,
            deuda_actual,
            limite_credito,
            condiciones_pago
          )
        `)
        .eq('tipos_tercero.clave', 'cliente')
        .order('creado_en', { ascending: false })

      if (search) {
        query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,nit.ilike.%${search}%,ci.ilike.%${search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .range(from, to)
        .returns<Cliente[]>()

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        error: null
      }
    } catch (error) {
      console.error('Error obteniendo clientes:', error)
      return { data: [], count: 0, page, totalPages: 0, error }
    }
  }

  // Obtener un cliente por ID
  async getClienteById(id: number) {
    try {
      const { data, error } = await supabase
        .from('terceros')
        .select(`
          *,
          tipos_tercero (
            id,
            clave,
            nombre
          ),
          cliente_info (
            tercero_id,
            deuda_actual,
            limite_credito,
            condiciones_pago
          )
        `)
        .eq('id', id)
        .eq('tipos_tercero.clave', 'cliente')
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error obteniendo cliente:', error)
      return { data: null, error }
    }
  }

  // Crear un nuevo cliente
  async createCliente(clienteData: CreateClienteData) {
    try {
      // Obtener el tipo_id para cliente
      const { data: tipoCliente } = await supabase
        .from('tipos_tercero')
        .select('id')
        .eq('clave', 'cliente')
        .single()

      if (!tipoCliente) throw new Error('Tipo cliente no encontrado')

      // Crear el tercero
      const { data: tercero, error: terceroError } = await supabase
        .from('terceros')
        .insert({
          tipo_id: tipoCliente.id,
          nombre: clienteData.nombre,
          nit: clienteData.nit,
          ci: clienteData.ci,
          email: clienteData.email,
          telefono: clienteData.telefono,
          direccion: clienteData.direccion,
          activo: true
        })
        .select()
        .single()

      if (terceroError) throw terceroError

      // Crear la información específica del cliente
      const { error: clienteInfoError } = await supabase
        .from('cliente_info')
        .insert({
          tercero_id: tercero.id,
          deuda_actual: 0,
          limite_credito: clienteData.limite_credito || 0,
          condiciones_pago: clienteData.condiciones_pago
        })

      if (clienteInfoError) throw clienteInfoError

      return { data: tercero, error: null }
    } catch (error) {
      console.error('Error creando cliente:', error)
      return { data: null, error }
    }
  }

  // Actualizar un cliente
  async updateCliente(id: number, clienteData: UpdateClienteData) {
    try {
      // Actualizar el tercero
      const { data: tercero, error: terceroError } = await supabase
        .from('terceros')
        .update({
          nombre: clienteData.nombre,
          nit: clienteData.nit,
          ci: clienteData.ci,
          email: clienteData.email,
          telefono: clienteData.telefono,
          direccion: clienteData.direccion,
          activo: clienteData.activo
        })
        .eq('id', id)
        .select()
        .single()

      if (terceroError) throw terceroError

      // Actualizar la información del cliente si se proporciona
      if (clienteData.limite_credito !== undefined || clienteData.condiciones_pago !== undefined) {
        const updateData: any = {}
        if (clienteData.limite_credito !== undefined) updateData.limite_credito = clienteData.limite_credito
        if (clienteData.condiciones_pago !== undefined) updateData.condiciones_pago = clienteData.condiciones_pago

        const { error: clienteInfoError } = await supabase
          .from('cliente_info')
          .upsert({
            tercero_id: id,
            ...updateData
          })

        if (clienteInfoError) throw clienteInfoError
      }

      return { data: tercero, error: null }
    } catch (error) {
      console.error('Error actualizando cliente:', error)
      return { data: null, error }
    }
  }

  // Eliminar un cliente (soft delete)
  async deleteCliente(id: number) {
    try {
      const { error } = await supabase
        .from('terceros')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error eliminando cliente:', error)
      return { error }
    }
  }

  // Obtener estadísticas de clientes
  async getClienteStats(): Promise<{ data: ClienteStats | null; error: any }> {
    try {
      // Estadísticas básicas
      const { data: stats, error: statsError } = await supabase
        .from('terceros')
        .select(`
          id,
          activo,
          tipos_tercero (
            id,
            clave,
            nombre
          ),
          cliente_info (
            deuda_actual,
            limite_credito
          )
        `)
        .eq('tipos_tercero.clave', 'cliente')

      if (statsError) throw statsError

      const totalClientes = stats?.length || 0
      const clientesActivos = stats?.filter(c => c.activo).length || 0
      const clientesConDeuda = stats?.filter(c => c.cliente_info && (c.cliente_info as any).deuda_actual > 0).length || 0
      const deudaTotal = stats?.reduce((sum, c) => sum + ((c.cliente_info as any)?.deuda_actual || 0), 0) || 0
      const limiteCreditoTotal = stats?.reduce((sum, c) => sum + ((c.cliente_info as any)?.limite_credito || 0), 0) || 0

      // Cliente top (por ventas) - simulado por ahora
      const clienteTop = {
        nombre: 'Restaurant El Parador',
        total_compras: 25400
      }

      const clienteStats: ClienteStats = {
        total_clientes: totalClientes,
        clientes_activos: clientesActivos,
        clientes_con_deuda: clientesConDeuda,
        deuda_total: deudaTotal,
        limite_credito_total: limiteCreditoTotal,
        cliente_top: clienteTop
      }

      return { data: clienteStats, error: null }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return { data: null, error }
    }
  }

  // Obtener historial de ventas de un cliente
  async getClienteVentas(clienteId: number): Promise<{ data: ClienteVenta[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          fecha,
          monto_total,
          estados (nombre),
          venta_items (id)
        `)
        .eq('tercero_id', clienteId)
        .order('fecha', { ascending: false })
        .limit(10)

      if (error) throw error

      const ventas: ClienteVenta[] = (data || []).map(venta => ({
        id: venta.id,
        fecha: venta.fecha,
        monto_total: venta.monto_total,
        estado: (venta.estados as any)?.nombre || 'Desconocido',
        productos_count: venta.venta_items?.length || 0
      }))

      return { data: ventas, error: null }
    } catch (error) {
      console.error('Error obteniendo ventas del cliente:', error)
      return { data: [], error }
    }
  }

  // Actualizar deuda de un cliente
  async updateDeudaCliente(clienteId: number, nuevaDeuda: number) {
    try {
      const { error } = await supabase
        .from('cliente_info')
        .upsert({
          tercero_id: clienteId,
          deuda_actual: nuevaDeuda
        })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error actualizando deuda:', error)
      return { error }
    }
  }
}

export const clienteService = new ClienteService()
