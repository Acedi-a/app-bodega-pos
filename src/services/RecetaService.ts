import { supabase } from '../lib/supabase'
import type { ProductoReceta } from '../types/productos'
import type { Insumo } from '../types/insumos'

export interface UpsertRecetaItemInput {
  producto_id: number
  insumo_id: number
  cantidad_por_unidad: number
  obligatorio?: boolean
}

class RecetaService {
  async getRecetaByProducto(productoId: number): Promise<{ data: ProductoReceta[] }> {
    const { data, error } = await supabase
      .from('receta_insumos')
      .select(`
        id,
        producto_id,
        insumo_id,
        cantidad_por_unidad,
        obligatorio,
        creado_en,
        insumos!insumo_id (
          id,
          nombre,
          stock,
          stock_minimo,
          unidades_medida!unidad_medida_id(
            id,
            clave,
            nombre
          )
        )
      `)
      .eq('producto_id', productoId)
      .order('obligatorio', { ascending: false })

    if (error) {
      console.error('Error getRecetaByProducto:', error)
      return { data: [] }
    }
    return { data: (data as any) || [] }
  }

  async addInsumoToReceta(input: UpsertRecetaItemInput): Promise<{ error: any, id?: number }> {
    const { data, error } = await supabase
      .from('receta_insumos')
      .insert({
        producto_id: input.producto_id,
        insumo_id: input.insumo_id,
        cantidad_por_unidad: input.cantidad_por_unidad,
        obligatorio: input.obligatorio ?? true
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error addInsumoToReceta:', error)
      return { error }
    }
    return { error: null, id: data?.id }
  }

  async updateRecetaItem(id: number, changes: Partial<Pick<UpsertRecetaItemInput, 'cantidad_por_unidad' | 'obligatorio'>>): Promise<{ error: any }> {
    const { error } = await supabase
      .from('receta_insumos')
      .update({
        cantidad_por_unidad: changes.cantidad_por_unidad,
        obligatorio: changes.obligatorio
      })
      .eq('id', id)

    if (error) {
      console.error('Error updateRecetaItem:', error)
      return { error }
    }
    return { error: null }
  }

  async removeRecetaItem(id: number): Promise<{ error: any }> {
    const { error } = await supabase
      .from('receta_insumos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error removeRecetaItem:', error)
      return { error }
    }
    return { error: null }
  }

  // Calcula la producción posible con stock actual de insumos
  async getUnidadesProducibles(productoId: number): Promise<{ unidades: number }> {
    const { data } = await this.getRecetaByProducto(productoId)
    if (!data || data.length === 0) return { unidades: 0 }
    const ratios = data
      .filter(r => (r.cantidad_por_unidad || 0) > 0 && (r.insumos as Insumo | undefined)?.stock !== undefined)
      .map(r => {
        const insumo = r.insumos as any
        const stock = Number(insumo?.stock || 0)
        const req = Number(r.cantidad_por_unidad || 0)
        return req > 0 ? stock / req : Infinity
      })
    if (ratios.length === 0) return { unidades: 0 }
    return { unidades: Math.floor(Math.min(...ratios)) }
  }
}

export const recetaService = new RecetaService()
