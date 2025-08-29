export interface Pedido {
  id: number
  tercero_id: number | null
  usuario_id: string | null
  fecha_pedido: string
  fecha_entrega: string | null
  estado_id: number | null
  notas?: string | null
  creado_en?: string
  actualizado_en?: string
}

export interface PedidoItem {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario?: number | null
  subtotal?: number | null
}

export interface NuevoPedidoItemInput {
  producto_id: number
  cantidad: number
}

export interface NuevoPedidoInput {
  tercero_id: number | null
  fecha_entrega?: string | null
  notas?: string | null
  items: NuevoPedidoItemInput[]
}

export interface FaltanteInsumo {
  insumo_id: number
  nombre: string
  requerido: number
  stock: number
}

export interface DisponibilidadLinea {
  producto_id: number
  solicitado: number
  stock_producto: number
  reservado_producto: number
  producible_por_insumos: number
  faltantes: FaltanteInsumo[]
  alcanza: boolean
  // Detalle potencial de reservas que se aplicarían (no necesariamente persistido todavía)
  detalleReserva?: {
    reservar_producto: number
    reservar_insumos: Array<{ insumo_id: number; cantidad: number }>
  }
}

export interface DisponibilidadPedido {
  lineas: DisponibilidadLinea[]
  alcanza: boolean
}
