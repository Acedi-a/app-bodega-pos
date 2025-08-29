import { supabase } from '../lib/supabase'
import { recetaService } from './RecetaService'
import { productoService } from './ProductoService'
import type { NuevoPedidoInput, DisponibilidadPedido, DisponibilidadLinea, Pedido, PedidoItem } from '../types/pedidos'

// Claves de movimiento que usaremos para registrar reservas/liberaciones en ambas tablas
const MOV_INV = {
  RESERVA: 'salida',        // reservar producto reduce stock
  LIBERACION: 'entrada',    // liberar producto aumenta stock
}
const MOV_INS = {
  RESERVA: 'salida',        // reservar insumo reduce stock
  LIBERACION: 'entrada',    // liberar insumo aumenta stock
  CONSUMO: 'consumo',       // si en algún futuro se confirma producción
}

class PedidoService {
  // =============================
  // LISTADOS y DETALLE
  // =============================
  async getPedidos(page: number = 1, limit: number = 10): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number }> {
    const offset = (page - 1) * limit
    const { data, error, count } = await supabase
      .from('pedidos')
      .select(`
        *,
        terceros:terceros!tercero_id (id, nombre),
        estados:estados!estado_id (id, clave, nombre)
      `, { count: 'exact' })
      .order('fecha_pedido', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) {
      console.error('getPedidos error', error)
      return { data: [], total: 0, totalPages: 0, currentPage: page }
    }
    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    return { data: data || [], total, totalPages, currentPage: page }
  }

  async getPedidoById(pedidoId: number): Promise<{ data: any | null }> {
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        terceros:terceros!tercero_id (id, nombre),
        estados:estados!estado_id (id, clave, nombre),
        items:pedido_items (*, productos:productos!producto_id (id, nombre, stock))
      `)
      .eq('id', pedidoId)
      .single()
    if (error) {
      console.error('getPedidoById error', error)
      return { data: null }
    }
    return { data: pedido }
  }

  private async getEstadoIdPedido(clave: string): Promise<number | null> {
    const { data } = await supabase.from('estados').select('id').eq('categoria', 'pedido').eq('clave', clave).single()
    return data?.id || null
  }

  async getTerceros(): Promise<{ data: Array<{ id: number; nombre: string }> }> {
    const { data, error } = await supabase
      .from('terceros')
      .select(`
        id,
        nombre,
        tipos_tercero!tipo_id (clave)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('getTerceros error', error)
      return { data: [] }
    }
    
    // Filtrar solo clientes o mostrar todos si no hay filtro de tipo
    const filteredData = (data || [])
      .filter((t: any) => t.tipos_tercero?.clave === 'cliente' || !t.tipos_tercero)
      .map((t: any) => ({ id: t.id, nombre: t.nombre }))
    
    return { data: filteredData }
  }
  
  // Calcula disponibilidad por líneas del pedido, considerando:
  // 1) Stock de producto disponible.
  // 2) Si falta producto, cuántas unidades se pueden producir con insumos obligatorios.
  // 3) Faltantes de insumos si no alcanza producir todo.
  async calcularDisponibilidad(input: NuevoPedidoInput): Promise<DisponibilidadPedido> {
    const lineas: DisponibilidadLinea[] = []
    for (const it of input.items) {
      const prodId = it.producto_id
      const solicitado = Number(it.cantidad)
      // 1) stock actual del producto
      const { data: prod } = await productoService.getProductoById(prodId)
      const stock_producto = Number(prod?.stock || 0)

      let reservado_producto = Math.min(stock_producto, solicitado)
      let restante = solicitado - reservado_producto

      // 2) si falta, calcular producibles por insumos obligatorios
      let producible_por_insumos = 0
      let faltantes: DisponibilidadLinea['faltantes'] = []
      if (restante > 0) {
        const { unidades } = await recetaService.getUnidadesProducibles(prodId)
        producible_por_insumos = Math.min(restante, Number(unidades || 0))
        // si aún falta, listar faltantes de insumos obligatorios
        const { data: receta } = await recetaService.getRecetaByProducto(prodId)
        const reqObl = receta.filter(r => r.obligatorio)
        const falt: DisponibilidadLinea['faltantes'] = []
        for (const r of reqObl) {
          const stockInsumo = Number((r.insumos as any)?.stock || 0)
          const requerido = Number(r.cantidad_por_unidad) * restante
          if (requerido > stockInsumo) {
            falt.push({ insumo_id: r.insumo_id, nombre: r.insumos?.nombre || `Insumo ${r.insumo_id}`, requerido, stock: stockInsumo })
          }
        }
        faltantes = falt
      }

      const alcanza = solicitado <= (stock_producto + producible_por_insumos)
      const detalleReserva = {
        reservar_producto: reservado_producto,
        reservar_insumos: [] as Array<{ insumo_id: number; cantidad: number }>
      }
      if (restante > 0) {
        // reservar insumos necesarios para producir lo producible
        const { data: receta } = await recetaService.getRecetaByProducto(prodId)
        for (const r of receta.filter(x => x.obligatorio)) {
          const porUnidad = Number(r.cantidad_por_unidad || 0)
          const cant = porUnidad * producible_por_insumos
          if (cant > 0) detalleReserva.reservar_insumos.push({ insumo_id: r.insumo_id, cantidad: cant })
        }
      }

      lineas.push({
        producto_id: prodId,
        solicitado,
        stock_producto,
        reservado_producto,
        producible_por_insumos,
        faltantes,
        alcanza,
        detalleReserva
      })
    }
    const alcanza = lineas.every(l => l.alcanza)
    return { lineas, alcanza }
  }

  // Crea el pedido y registra movimientos de RESERVA (producto y/o insumos) según disponibilidad calculada.
  async crearPedidoConReserva(input: NuevoPedidoInput): Promise<{ ok: boolean; pedido?: Pedido; items?: PedidoItem[]; error?: string }> {
    try {
      // 1) calcular disponibilidad
      const disp = await this.calcularDisponibilidad(input)
      // 2) crear pedido
    const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          tercero_id: input.tercero_id,
          fecha_entrega: input.fecha_entrega || null,
          notas: input.notas || null,
      estado_id: await this.getEstadoIdPedido('pendiente')
        })
        .select()
        .single()
      if (errPedido) throw errPedido

      // 3) crear items
      const itemsPayload = input.items.map(it => ({
        pedido_id: pedido.id,
        producto_id: it.producto_id,
        cantidad: it.cantidad,
      }))
      const { data: items, error: errItems } = await supabase
        .from('pedido_items')
        .insert(itemsPayload)
        .select()
      if (errItems) throw errItems

      // 4) registrar movimientos de reserva segun disp.lineas
      for (const linea of disp.lineas) {
        // 4.1) Reserva de producto (salida)
        if (linea.detalleReserva?.reservar_producto) {
          await productoService.registrarMovimientoInventario(
            linea.producto_id,
            MOV_INV.RESERVA as 'entrada' | 'salida',
            linea.detalleReserva.reservar_producto,
            pedido.id,
            'pedido',
            undefined,
            'Reserva de producto para pedido'
          )
        }
        // 4.2) Reserva de insumos para fabricar el restante producible
        for (const ins of (linea.detalleReserva?.reservar_insumos || [])) {
          // Insert en movimientos_insumos y disminuir stock
          const { data: tipo } = await supabase
            .from('tipos_movimiento_insumos')
            .select('id')
            .eq('clave', MOV_INS.RESERVA)
            .single()
          if (!tipo) throw new Error('Tipo de movimiento insumo RESERVA no encontrado')
          // obtener stock actual
          const { data: insumo } = await supabase
            .from('insumos')
            .select('stock')
            .eq('id', ins.insumo_id)
            .single()
          const stockActual = Number(insumo?.stock || 0)
          const nuevoStock = stockActual - ins.cantidad
          if (nuevoStock < 0) throw new Error(`Stock insuficiente de insumo ${ins.insumo_id}`)
          // actualizar stock
          const { error: upErr } = await supabase
            .from('insumos')
            .update({ stock: nuevoStock })
            .eq('id', ins.insumo_id)
          if (upErr) throw upErr
          const { error: errMov } = await supabase
            .from('movimientos_insumos')
            .insert({
              insumo_id: ins.insumo_id,
              tipo_id: tipo.id,
              cantidad: ins.cantidad,
              referencia_tipo: 'pedido',
              referencia_id: pedido.id,
              notas: 'Reserva de insumo para pedido'
            })
          if (errMov) throw errMov
        }
      }

      return { ok: true, pedido, items: items || [] }
    } catch (e: any) {
      console.error('crearPedidoConReserva error', e)
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // Libera reservas al reducir cantidad o cancelar pedido: revierte movimientos
  async liberarReservasDePedido(pedidoId: number, deltaPorProducto: Array<{ producto_id: number; liberar_producto: number; liberar_insumos: Array<{ insumo_id: number; cantidad: number }> }>) {
    for (const d of deltaPorProducto) {
      if (d.liberar_producto > 0) {
        await productoService.registrarMovimientoInventario(
          d.producto_id,
          MOV_INV.LIBERACION as 'entrada' | 'salida',
          d.liberar_producto,
          pedidoId,
          'pedido',
          undefined,
          'Liberación de producto por ajuste/cancelación de pedido'
        )
      }
      for (const ins of d.liberar_insumos || []) {
        const { data: tipo } = await supabase
          .from('tipos_movimiento_insumos')
          .select('id')
          .eq('clave', MOV_INS.LIBERACION)
          .single()
        if (!tipo) throw new Error('Tipo de movimiento insumo LIBERACION no encontrado')
        // actualizar stock (+)
        const { data: insumo } = await supabase
          .from('insumos')
          .select('stock')
          .eq('id', ins.insumo_id)
          .single()
        const stockActual = Number(insumo?.stock || 0)
        const nuevoStock = stockActual + ins.cantidad
        const { error: upErr } = await supabase
          .from('insumos')
          .update({ stock: nuevoStock })
          .eq('id', ins.insumo_id)
        if (upErr) throw upErr
        const { error: errMov } = await supabase
          .from('movimientos_insumos')
          .insert({
            insumo_id: ins.insumo_id,
            tipo_id: tipo.id,
            cantidad: ins.cantidad,
            referencia_tipo: 'pedido',
            referencia_id: pedidoId,
            notas: 'Liberación de insumo por ajuste/cancelación de pedido'
          })
        if (errMov) throw errMov
      }
    }
  }

  // Obtener reservas actuales (netas) para un pedido, por producto e insumo
  async getReservasNetas(pedidoId: number): Promise<{
    productos: Record<number, number>
    insumos: Record<number, number>
  }> {
    const productos: Record<number, number> = {}
    const insumos: Record<number, number> = {}
    // productos
    const { data: movProd } = await supabase
      .from('movimientos_inventario')
      .select(`producto_id, cantidad, tipos_movimiento_inventario!tipo_id (clave)`) 
      .eq('referencia_tipo', 'pedido')
      .eq('referencia_id', pedidoId)
    for (const m of (movProd as any[] | null) || []) {
      const clave = m.tipos_movimiento_inventario?.clave
      const signo = clave === 'salida' ? -1 : clave === 'entrada' ? 1 : 0
      if (!productos[m.producto_id]) productos[m.producto_id] = 0
      productos[m.producto_id] += signo * Number(m.cantidad || 0)
    }
    // insumos
    const { data: movIns } = await supabase
      .from('movimientos_insumos')
      .select(`insumo_id, cantidad, tipos_movimiento_insumos!tipo_id (clave)`) 
      .eq('referencia_tipo', 'pedido')
      .eq('referencia_id', pedidoId)
    for (const m of (movIns as any[] | null) || []) {
      const clave = m.tipos_movimiento_insumos?.clave
      const signo = clave === 'salida' ? -1 : clave === 'entrada' ? 1 : 0
      if (!insumos[m.insumo_id]) insumos[m.insumo_id] = 0
      insumos[m.insumo_id] += signo * Number(m.cantidad || 0)
    }
    // valores positivos representan cantidad actualmente reservada
    for (const k in productos) productos[k as any] = Math.max(0, -productos[k as any])
    for (const k in insumos) insumos[k as any] = Math.max(0, -insumos[k as any])
    return { productos, insumos }
  }

  // Ajustar un pedido existente a nuevas cantidades (reserva o liberación del delta)
  async ajustarPedido(pedidoId: number, nuevosItems: Array<{ producto_id: number; cantidad: number }>): Promise<{ ok: boolean; error?: string }> {
    try {
      // 1) disponibilidad deseada (solo para construir reservas target)
      const disp = await this.calcularDisponibilidad({ tercero_id: null, items: nuevosItems })
      // 2) reservas actuales
      const actuales = await this.getReservasNetas(pedidoId)
      // 3) por cada línea, calcular delta en producto e insumos
      for (const l of disp.lineas) {
        const actualProd = actuales.productos[l.producto_id] || 0
        const targetProd = l.detalleReserva?.reservar_producto || 0
        const deltaProd = targetProd - actualProd
        if (deltaProd > 0) {
          await productoService.registrarMovimientoInventario(l.producto_id, 'salida', deltaProd, pedidoId, 'pedido', undefined, 'Reserva adicional por ajuste de pedido')
        } else if (deltaProd < 0) {
          await productoService.registrarMovimientoInventario(l.producto_id, 'entrada', Math.abs(deltaProd), pedidoId, 'pedido', undefined, 'Liberación por reducción de pedido')
        }
        // insumos
        const targetIns: Record<number, number> = {}
        for (const r of (l.detalleReserva?.reservar_insumos || [])) {
          targetIns[r.insumo_id] = (targetIns[r.insumo_id] || 0) + r.cantidad
        }
        const insIds = new Set([...Object.keys(targetIns).map(Number), ...Object.keys(actuales.insumos).map(Number)])
        for (const insId of insIds) {
          const actual = actuales.insumos[insId] || 0
          const target = targetIns[insId] || 0
          const delta = target - actual
          if (delta > 0) {
            // reservar más (salida)
            const { data: tipo } = await supabase.from('tipos_movimiento_insumos').select('id').eq('clave', 'salida').single()
            if (!tipo) throw new Error('Tipo salida no encontrado')
            const { data: insumo } = await supabase.from('insumos').select('stock').eq('id', insId).single()
            const stockActual = Number(insumo?.stock || 0)
            if (stockActual < delta) throw new Error(`Stock insuficiente de insumo ${insId}`)
            const { error: upErr } = await supabase.from('insumos').update({ stock: stockActual - delta }).eq('id', insId)
            if (upErr) throw upErr
            const { error: movErr } = await supabase.from('movimientos_insumos').insert({ insumo_id: insId, tipo_id: tipo.id, cantidad: delta, referencia_tipo: 'pedido', referencia_id: pedidoId, notas: 'Reserva adicional por ajuste de pedido' })
            if (movErr) throw movErr
          } else if (delta < 0) {
            // liberar (entrada)
            const { data: tipo } = await supabase.from('tipos_movimiento_insumos').select('id').eq('clave', 'entrada').single()
            if (!tipo) throw new Error('Tipo entrada no encontrado')
            const { data: insumo } = await supabase.from('insumos').select('stock').eq('id', insId).single()
            const stockActual = Number(insumo?.stock || 0)
            const liberar = Math.abs(delta)
            const { error: upErr } = await supabase.from('insumos').update({ stock: stockActual + liberar }).eq('id', insId)
            if (upErr) throw upErr
            const { error: movErr } = await supabase.from('movimientos_insumos').insert({ insumo_id: insId, tipo_id: tipo.id, cantidad: liberar, referencia_tipo: 'pedido', referencia_id: pedidoId, notas: 'Liberación por reducción de pedido' })
            if (movErr) throw movErr
          }
        }
      }
      // 4) actualizar cantidades en pedido_items (upsert simple)
      for (const it of nuevosItems) {
        await supabase
          .from('pedido_items')
          .update({ cantidad: it.cantidad })
          .eq('pedido_id', pedidoId)
          .eq('producto_id', it.producto_id)
      }
      return { ok: true }
    } catch (e: any) {
      console.error('ajustarPedido error', e)
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // Cancelar pedido: liberar todas las reservas y marcar estado 'cancelado'
  async cancelarPedido(pedidoId: number): Promise<{ ok: boolean; error?: string }> {
    try {
      const reservas = await this.getReservasNetas(pedidoId)
      const delta = Object.keys(reservas.productos).map(pid => ({
        producto_id: Number(pid),
        liberar_producto: reservas.productos[Number(pid)] || 0,
        liberar_insumos: [] as Array<{ insumo_id: number; cantidad: number }>
      }))
      // agregar insumos a primera línea
      const mapIns: Record<number, number> = { ...reservas.insumos }
      const insList = Object.keys(mapIns)
      if (insList.length) {
        if (delta.length === 0) delta.push({ producto_id: 0, liberar_producto: 0, liberar_insumos: [] })
        for (const k of insList) {
          delta[0].liberar_insumos.push({ insumo_id: Number(k), cantidad: mapIns[Number(k)] })
        }
      }
      await this.liberarReservasDePedido(pedidoId, delta)
      const cancelId = await this.getEstadoIdPedido('cancelado')
      if (cancelId) await supabase.from('pedidos').update({ estado_id: cancelId }).eq('id', pedidoId)
      return { ok: true }
    } catch (e: any) {
      console.error('cancelarPedido error', e)
      return { ok: false, error: e?.message || String(e) }
    }
  }
}

export const pedidoService = new PedidoService()
