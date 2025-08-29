export interface UnidadMedida {
  id: number
  clave: string
  nombre: string
  creado_en: string
}

export interface Insumo {
  id: number
  nombre: string
  descripcion?: string
  unidad_medida_id?: number
  stock: number
  stock_minimo: number
  foto_url?: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  
  // Relaciones
  unidades_medida?: UnidadMedida
}

export interface CreateInsumoData {
  nombre: string
  descripcion?: string
  unidad_medida_id?: number
  stock?: number
  stock_minimo?: number
  foto_url?: string
  activo?: boolean
}

export interface UpdateInsumoData {
  nombre?: string
  descripcion?: string
  unidad_medida_id?: number
  stock?: number
  stock_minimo?: number
  foto_url?: string
  activo?: boolean
}

export interface InsumoFilter {
  search?: string
  unidad_medida_id?: number
  stock_bajo?: boolean
  activo?: boolean
}

export interface InsumoStats {
  total_insumos: number
  insumos_activos: number
  insumos_stock_bajo: number
  valor_total_inventario: number
}

export interface GetInsumosResponse {
  data: Insumo[]
  count: number
  totalPages: number
  currentPage: number
  stats: InsumoStats
}

// Tipos para movimientos de insumos
export interface TipoMovimientoInsumo {
  id: number
  clave: string
  nombre: string
  creado_en: string
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
  insumos?: Insumo
  tipos_movimiento_insumos?: TipoMovimientoInsumo
  usuarios?: {
    id: string
    nombre: string
    apellido?: string
  }
}

// Tipos para recetas (relación insumo-producto)
export interface InsumoReceta {
  id: number
  producto_id: number
  insumo_id: number
  cantidad_por_unidad: number
  obligatorio: boolean
  creado_en: string
  
  // Relaciones
  productos?: {
    id: number
    nombre: string
    sku?: string
    precio: number
  }
}

export interface InsumoDetailData {
  insumo: Insumo
  movimientos: MovimientoInsumo[]
  recetas: InsumoReceta[]
  estadisticas: {
    total_consumido: number
    total_recibido: number
    movimientos_recientes: number
    productos_asociados: number
  }
}
