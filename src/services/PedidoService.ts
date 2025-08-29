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
      console.log('=== INICIO ajustarPedido ===')
      console.log('pedidoId:', pedidoId)
      console.log('nuevosItems:', nuevosItems)
      
      // 1) obtener items actuales del pedido
      const { data: itemsActuales, error: errorItems } = await supabase
        .from('pedido_items')
        .select('producto_id, cantidad')
        .eq('pedido_id', pedidoId)

      if (errorItems) {
        console.error('Error obteniendo items actuales:', errorItems)
        throw errorItems
      }

      console.log('Items actuales:', itemsActuales)

      const actualesMap: Record<number, number> = {}
      for (const item of itemsActuales || []) {
        actualesMap[item.producto_id] = item.cantidad
      }

      // 2) calcular deltas por producto - filtrar items con cantidad > 0
      const itemsValidos = nuevosItems.filter(item => item.cantidad > 0)
      const deltas: Array<{ producto_id: number; delta: number }> = []
      
      // productos en los nuevos items
      for (const nuevoItem of itemsValidos) {
        const cantidadActual = actualesMap[nuevoItem.producto_id] || 0
        const delta = nuevoItem.cantidad - cantidadActual
        if (delta !== 0) {
          deltas.push({ producto_id: nuevoItem.producto_id, delta })
        }
      }

      // productos que se eliminaron completamente (incluyendo los que se redujeron a 0)
      for (const [prodIdStr, cantidadActual] of Object.entries(actualesMap)) {
        const prodId = Number(prodIdStr)
        const enNuevos = itemsValidos.find(i => i.producto_id === prodId)
        if (!enNuevos) {
          deltas.push({ producto_id: prodId, delta: -cantidadActual })
        }
      }

      console.log('Deltas calculados:', deltas)

      // 3) procesar cada delta
      for (const { producto_id, delta } of deltas) {
        console.log(`=== Procesando delta para producto ${producto_id}: ${delta} ===`)
        try {
          if (delta > 0) {
            // Aumentó: reservar más
            console.log(`Intentando reservar ${delta} unidades para producto ${producto_id}`)
            await this.reservarParaProducto(pedidoId, producto_id, delta)
            console.log(`✅ Reservado ${delta} unidades para producto ${producto_id}`)
          } else if (delta < 0) {
            // Disminuyó: liberar
            console.log(`Intentando liberar ${Math.abs(delta)} unidades para producto ${producto_id}`)
            await this.liberarParaProducto(pedidoId, producto_id, Math.abs(delta))
            console.log(`✅ Liberado ${Math.abs(delta)} unidades para producto ${producto_id}`)
          }
        } catch (deltaError) {
          console.error(`Error procesando delta para producto ${producto_id}:`, deltaError)
          throw deltaError
        }
      }

      // 4) actualizar los items en la base de datos
      console.log('Actualizando items en base de datos...')
      const { error: deleteErr } = await supabase.from('pedido_items').delete().eq('pedido_id', pedidoId)
      if (deleteErr) {
        console.error('Error eliminando items:', deleteErr)
        throw deleteErr
      }

      if (itemsValidos.length > 0) {
        const insertData = itemsValidos.map(item => ({
          pedido_id: pedidoId,
          producto_id: item.producto_id,
          cantidad: item.cantidad
        }))
        console.log('Insertando items:', insertData)
        
        const { error: insertErr } = await supabase
          .from('pedido_items')
          .insert(insertData)
        if (insertErr) {
          console.error('Error insertando items:', insertErr)
          throw insertErr
        }
        console.log('✅ Items actualizados correctamente')
      }

      console.log('=== FIN ajustarPedido EXITOSO ===')
      return { ok: true }
    } catch (e: any) {
      console.error('=== ERROR en ajustarPedido ===', e)
      return { ok: false, error: e?.message || String(e) }
    }
  }

  // Reservar stock e insumos para una cantidad específica de un producto
  private async reservarParaProducto(pedidoId: number, productoId: number, cantidad: number) {
    console.log(`reservarParaProducto: pedido=${pedidoId}, producto=${productoId}, cantidad=${cantidad}`)
    
    // calcular disponibilidad para esta cantidad específica
    const disp = await this.calcularDisponibilidad({ 
      tercero_id: null, 
      items: [{ producto_id: productoId, cantidad }] 
    })
    
    console.log('Disponibilidad calculada:', disp.lineas[0])
    
    const linea = disp.lineas[0]
    if (!linea) throw new Error(`No se pudo calcular disponibilidad para producto ${productoId}`)
    
    // reservar producto desde stock
    if (linea.detalleReserva?.reservar_producto) {
      await productoService.registrarMovimientoInventario(
        productoId,
        'salida',
        linea.detalleReserva.reservar_producto,
        pedidoId,
        'pedido',
        undefined,
        'Reserva por ajuste de pedido'
      )
      console.log(`Reservado ${linea.detalleReserva.reservar_producto} unidades de producto ${productoId}`)
    }
    
    // reservar insumos
    for (const ins of (linea.detalleReserva?.reservar_insumos || [])) {
      const { data: tipo } = await supabase
        .from('tipos_movimiento_insumos')
        .select('id')
        .eq('clave', MOV_INS.RESERVA)
        .single()
      if (!tipo) throw new Error('Tipo de movimiento insumo RESERVA no encontrado')
      
      // actualizar stock del insumo
      const { data: insumo } = await supabase
        .from('insumos')
        .select('stock')
        .eq('id', ins.insumo_id)
        .single()
      const stockActual = Number(insumo?.stock || 0)
      if (stockActual < ins.cantidad) throw new Error(`Stock insuficiente de insumo ${ins.insumo_id}`)
      
      const { error: upErr } = await supabase
        .from('insumos')
        .update({ stock: stockActual - ins.cantidad })
        .eq('id', ins.insumo_id)
      if (upErr) throw upErr
      
      // registrar movimiento
      const { error: movErr } = await supabase
        .from('movimientos_insumos')
        .insert({
          insumo_id: ins.insumo_id,
          tipo_id: tipo.id,
          cantidad: ins.cantidad,
          referencia_tipo: 'pedido',
          referencia_id: pedidoId,
          notas: 'Reserva de insumo por ajuste de pedido'
        })
      if (movErr) throw movErr
      
      console.log(`Reservado ${ins.cantidad} unidades de insumo ${ins.insumo_id}`)
    }
  }

  // Liberar stock e insumos para una cantidad específica de un producto
  private async liberarParaProducto(pedidoId: number, productoId: number, cantidad: number) {
    console.log(`liberarParaProducto: pedido=${pedidoId}, producto=${productoId}, cantidad=${cantidad}`)
    
    // 1. Obtener las reservas actuales del pedido
    const reservasActuales = await this.getReservasNetas(pedidoId)
    console.log('Reservas actuales del pedido:', reservasActuales)
    
    const reservaProducto = reservasActuales.productos[productoId] || 0
    console.log(`Reserva actual de producto ${productoId}:`, reservaProducto)
    
    // 2. Calcular proporción a liberar basada en la cantidad solicitada vs total reservado
    // Primero necesitamos saber cuánto se había solicitado originalmente
    const { data: itemActual } = await supabase
      .from('pedido_items')
      .select('cantidad')
      .eq('pedido_id', pedidoId)
      .eq('producto_id', productoId)
      .single()
    
    const cantidadOriginal = Number(itemActual?.cantidad || 0)
    console.log(`Cantidad original del producto ${productoId}:`, cantidadOriginal)
    
    // Si no hay cantidad original, no podemos calcular proporciones
    if (cantidadOriginal === 0) {
      console.log('No hay cantidad original, liberando toda la reserva del producto')
      // Liberar toda la reserva del producto
      if (reservaProducto > 0) {
        await productoService.registrarMovimientoInventario(
          productoId,
          'entrada',
          reservaProducto,
          pedidoId,
          'pedido',
          undefined,
          'Liberación total por eliminación de producto del pedido'
        )
        console.log(`Liberado ${reservaProducto} unidades de producto ${productoId}`)
      }
      
      // Liberar todos los insumos asociados a este pedido
      for (const [insumoIdStr, cantidadReservada] of Object.entries(reservasActuales.insumos)) {
        const insumoId = Number(insumoIdStr)
        if (cantidadReservada > 0) {
          await this.liberarInsumo(pedidoId, insumoId, cantidadReservada)
          console.log(`Liberado ${cantidadReservada} unidades de insumo ${insumoId}`)
        }
      }
      return
    }
    
    // 3. Calcular qué proporción de las reservas liberar
    const proporcion = cantidad / cantidadOriginal
    console.log(`Proporción a liberar: ${cantidad}/${cantidadOriginal} = ${proporcion}`)
    
    // 4. Liberar producto proporcionalmente
    const cantidadProductoALiberar = Math.floor(reservaProducto * proporcion)
    if (cantidadProductoALiberar > 0) {
      await productoService.registrarMovimientoInventario(
        productoId,
        'entrada',
        cantidadProductoALiberar,
        pedidoId,
        'pedido',
        undefined,
        `Liberación proporcional por reducción de pedido (${cantidad} unidades)`
      )
      console.log(`Liberado ${cantidadProductoALiberar} unidades de producto ${productoId}`)
    }
    
    // 5. Liberar insumos proporcionalmente
    // Para esto necesitamos calcular cuántos insumos corresponden a esta cantidad
    const { data: receta } = await recetaService.getRecetaByProducto(productoId)
    console.log(`Receta para producto ${productoId}:`, receta)
    
    for (const r of receta.filter(x => x.obligatorio)) {
      const porUnidad = Number(r.cantidad_por_unidad || 0)
      const cantidadInsumoALiberar = porUnidad * cantidad
      
      if (cantidadInsumoALiberar > 0) {
        await this.liberarInsumo(pedidoId, r.insumo_id, cantidadInsumoALiberar)
        console.log(`Liberado ${cantidadInsumoALiberar} unidades de insumo ${r.insumo_id} (${porUnidad} por unidad × ${cantidad})`)
      }
    }
  }
  
  // Método auxiliar para liberar un insumo específico
  private async liberarInsumo(pedidoId: number, insumoId: number, cantidad: number) {
    const { data: tipo } = await supabase
      .from('tipos_movimiento_insumos')
      .select('id')
      .eq('clave', MOV_INS.LIBERACION)
      .single()
    if (!tipo) throw new Error('Tipo de movimiento insumo LIBERACION no encontrado')
    
    // actualizar stock del insumo
    const { data: insumo } = await supabase
      .from('insumos')
      .select('stock')
      .eq('id', insumoId)
      .single()
    const stockActual = Number(insumo?.stock || 0)
    
    const { error: upErr } = await supabase
      .from('insumos')
      .update({ stock: stockActual + cantidad })
      .eq('id', insumoId)
    if (upErr) throw upErr
    
    // registrar movimiento
    const { error: movErr } = await supabase
      .from('movimientos_insumos')
      .insert({
        insumo_id: insumoId,
        tipo_id: tipo.id,
        cantidad: cantidad,
        referencia_tipo: 'pedido',
        referencia_id: pedidoId,
        notas: 'Liberación de insumo por ajuste de pedido'
      })
    if (movErr) throw movErr
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
