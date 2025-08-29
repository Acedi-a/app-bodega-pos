import { supabase } from '../lib/supabase'
import { recetaService } from './RecetaService'
import { productoService } from './ProductoService'

export interface ProduceResult {
  ok: boolean
  produccion_id?: number
  error?: string
  faltantes?: Array<{ insumo_id: number; nombre?: string; requerido: number; stock: number; obligatorio: boolean }>
}

class ProductionService {
  async producirProducto(productoId: number, cantidad: number, usuarioId?: string | null, notas?: string): Promise<ProduceResult> {
    if (cantidad <= 0) return { ok: false, error: 'Cantidad inválida' }

    // 1) Obtener receta con stock actual de insumos
    const { data: receta } = await recetaService.getRecetaByProducto(productoId)
    if (!receta || receta.length === 0) return { ok: false, error: 'El producto no tiene receta definida' }

    // 2) Calcular consumos requeridos y validar stock
    const requeridos = receta.map(r => ({
      insumo_id: r.insumo_id,
      nombre: r.insumos?.nombre,
      obligatorio: r.obligatorio,
      requerido: Number(r.cantidad_por_unidad || 0) * cantidad,
      stock: Number((r.insumos as any)?.stock || 0)
    }))

    const faltantes = requeridos.filter(x => x.obligatorio && x.requerido > x.stock)
    if (faltantes.length > 0) {
      return { ok: false, error: 'Stock insuficiente en insumos obligatorios', faltantes }
    }

    // 3) Crear registro de produccion
    const { data: prod, error: prodErr } = await supabase
      .from('producciones')
      .insert({
        producto_id: productoId,
        cantidad_producida: cantidad,
        usuario_id: usuarioId || null,
        notas
      })
      .select('id')
      .single()

    if (prodErr) return { ok: false, error: String(prodErr.message || prodErr) }
    const produccionId = prod?.id as number

    // 4) Obtener tipo IDs para movimientos
    const [{ data: tipoConsumo }, { data: tipoEntrada }] = await Promise.all([
      supabase.from('tipos_movimiento_insumos').select('id').eq('clave', 'consumo').single(),
      supabase.from('tipos_movimiento_inventario').select('id').eq('clave', 'entrada').single()
    ])

    if (!tipoConsumo?.id || !tipoEntrada?.id) {
      return { ok: false, error: 'No se encontraron tipos de movimiento requeridos' }
    }

    // 5) Consumir insumos (obligatorios y opcionales hasta donde alcance)
    for (const req of requeridos) {
      const consumo = req.requerido
      if (consumo <= 0) continue
      // Si es opcional y no alcanza stock, consumir hasta stock disponible
      const consumir = req.obligatorio ? consumo : Math.min(consumo, req.stock)

      if (consumir <= 0) continue

      // a) Actualizar stock
      const { error: upErr } = await supabase
        .from('insumos')
        .update({ stock: (req.stock - consumir) })
        .eq('id', req.insumo_id)
      if (upErr) return { ok: false, error: `Error actualizando stock de insumo ${req.insumo_id}: ${upErr.message}` }

      // b) Insertar movimiento de insumo (consumo)
      const { error: movErr } = await supabase
        .from('movimientos_insumos')
        .insert({
          insumo_id: req.insumo_id,
          tipo_id: tipoConsumo.id,
          cantidad: consumir,
          usuario_id: usuarioId || null,
          referencia_tipo: 'produccion',
          referencia_id: produccionId,
          notas: notas || 'Consumo por producción'
        })
      if (movErr) return { ok: false, error: `Error registrando movimiento de insumo ${req.insumo_id}: ${movErr.message}` }

      // c) Insertar produccion_insumos
      const { error: pinErr } = await supabase
        .from('produccion_insumos')
        .insert({
          produccion_id: produccionId,
          insumo_id: req.insumo_id,
          cantidad_consumida: consumir
        })
      if (pinErr) return { ok: false, error: `Error registrando detalle de producción: ${pinErr.message}` }
    }

    // 6) Movimiento de inventario de producto (entrada) y actualización de stock
    try {
      await productoService.registrarMovimientoInventario(productoId, 'entrada', cantidad, produccionId, 'produccion', usuarioId || undefined, 'Producción')
    } catch (e: any) {
      return { ok: false, error: `Error registrando movimiento de producto: ${e?.message || e}` }
    }

    return { ok: true, produccion_id: produccionId }
  }
}

export const productionService = new ProductionService()
