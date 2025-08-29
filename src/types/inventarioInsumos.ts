export interface TipoMovimientoInsumo {
  id: number
  clave: string
  nombre: string
  creado_en?: string
}

export interface MovimientoInsumo {
  id: number
  insumo_id: number
  tipo_id: number
  referencia_id?: number
  referencia_tipo?: string
  cantidad: number
  usuario_id?: string
  fecha: string
  notas?: string
  creado_en: string
  
  // Relaciones
  insumos?: {
    id: number
    nombre: string
    stock: number
    unidades_medida?: {
      id: number
      nombre: string
      clave?: string
    }
  }
  tipos_movimiento_insumos?: TipoMovimientoInsumo
  usuarios?: {
    id: string
    nombre: string
    apellido?: string
  }
}

export interface InventarioInsumosFilter {
  search?: string
  insumo_id?: number
  tipo_id?: number
  referencia_tipo?: string
  fecha_desde?: string
  fecha_hasta?: string
  usuario_id?: string
}

export interface InventarioInsumosStats {
  total_movimientos: number
  movimientos_entrada: number
  movimientos_salida: number
  insumos_afectados: number
}

export interface GetMovimientosInsumosResponse {
  data: MovimientoInsumo[]
  count: number
  totalPages: number
  currentPage: number
  stats: InventarioInsumosStats
}
