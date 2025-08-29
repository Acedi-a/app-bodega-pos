export interface Perdida {
  id: number
  tipo_item: 'insumo' | 'producto'
  insumo_id?: number | null
  producto_id?: number | null
  cantidad: number
  valor_unitario?: number | null
  valor_total?: number
  motivo?: string | null
  usuario_id?: string | null
  fecha: string
  creado_en: string
  
  // Relaciones expandidas
  insumos?: {
    id: number
    nombre: string
    unidad_medida_id?: number
    unidades_medida?: {
      nombre: string
      clave: string
    }
  }
  productos?: {
    id: number
    nombre: string
    precio: number
    costo: number
    unidad_medida_id?: number
    unidades_medida?: {
      nombre: string
      clave: string
    }
  }
  usuarios?: {
    id: string
    nombre: string
    apellido?: string
  }
}

export interface NuevaPerdida {
  tipo_item: 'insumo' | 'producto'
  insumo_id?: number | null
  producto_id?: number | null
  cantidad: number
  valor_unitario?: number | null
  motivo?: string | null
}

export interface ResumenPerdidas {
  totalItems: number
  valorTotalGeneral: number
  perdidasPorTipo: {
    productos: {
      cantidad: number
      valor: number
    }
    insumos: {
      cantidad: number
      valor: number
    }
  }
  topPerdidas: Array<{
    tipo: 'insumo' | 'producto'
    id: number
    nombre: string
    cantidadTotal: number
    valorTotal: number
    frecuencia: number
  }>
}

export interface FiltrosPerdidas {
  tipo_item?: 'insumo' | 'producto'
  fecha_desde?: string
  fecha_hasta?: string
  usuario_id?: string
  producto_id?: number
  insumo_id?: number
  motivo?: string
}
