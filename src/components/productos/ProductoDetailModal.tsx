import React, { useState, useEffect } from 'react'
import { X, Package, BarChart3, History, Users, DollarSign, Calendar, Tag } from 'lucide-react'
import { productoService } from '../../services/ProductoService'
import type { 
  Producto, 
  ProductoMovimiento, 
  ProductoReceta, 
  ProductoVenta 
} from '../../types/productos'

interface ProductoDetailModalProps {
  isOpen: boolean
  onClose: () => void
  producto: Producto
}

type TabType = 'general' | 'movimientos' | 'recetas' | 'ventas'

export const ProductoDetailModal: React.FC<ProductoDetailModalProps> = ({
  isOpen,
  onClose,
  producto
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [movimientos, setMovimientos] = useState<ProductoMovimiento[]>([])
  const [recetas, setRecetas] = useState<ProductoReceta[]>([])
  const [ventas, setVentas] = useState<ProductoVenta[]>([])
  const [loadingMovimientos, setLoadingMovimientos] = useState(false)
  const [loadingRecetas, setLoadingRecetas] = useState(false)
  const [loadingVentas, setLoadingVentas] = useState(false)

  useEffect(() => {
    if (isOpen && producto) {
      setActiveTab('general')
    }
  }, [isOpen, producto])

  const loadMovimientos = async () => {
    if (loadingMovimientos) return
    setLoadingMovimientos(true)
    try {
      const { data } = await productoService.getProductoMovimientos(producto.id)
      setMovimientos(data)
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setLoadingMovimientos(false)
    }
  }

  const loadRecetas = async () => {
    if (loadingRecetas) return
    setLoadingRecetas(true)
    try {
      const { data } = await productoService.getProductoRecetas(producto.id)
      setRecetas(data)
    } catch (error) {
      console.error('Error cargando recetas:', error)
    } finally {
      setLoadingRecetas(false)
    }
  }

  const loadVentas = async () => {
    if (loadingVentas) return
    setLoadingVentas(true)
    try {
      const { data } = await productoService.getProductoVentas(producto.id)
      setVentas(data)
    } catch (error) {
      console.error('Error cargando ventas:', error)
    } finally {
      setLoadingVentas(false)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'movimientos' && movimientos.length === 0) {
      loadMovimientos()
    } else if (tab === 'recetas' && recetas.length === 0) {
      loadRecetas()
    } else if (tab === 'ventas' && ventas.length === 0) {
      loadVentas()
    }
  }

  const getStockStatus = () => {
    if (producto.stock <= 0) {
      return { status: 'sin-stock', label: 'Sin Stock', color: 'text-red-600 bg-red-100' }
    } else if (producto.stock <= (producto.stock_minimo || 0)) {
      return { status: 'stock-bajo', label: 'Stock Bajo', color: 'text-amber-600 bg-amber-100' }
    }
    return { status: 'normal', label: 'Normal', color: 'text-green-600 bg-green-100' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen || !producto) return null

  const stockStatus = getStockStatus()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{producto.nombre}</h2>
              <p className="text-sm text-gray-500">
                {producto.sku ? `SKU: ${producto.sku}` : 'Detalles del producto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'general', label: 'General', icon: Package },
              { key: 'movimientos', label: 'Movimientos', icon: History },
              { key: 'recetas', label: 'Recetas', icon: Users },
              { key: 'ventas', label: 'Ventas', icon: DollarSign }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key as TabType)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-lg font-semibold text-gray-900">{producto.nombre}</p>
                  </div>
                  
                  {producto.descripcion && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-gray-700">{producto.descripcion}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {producto.sku && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">SKU</label>
                        <p className="text-gray-700">{producto.sku}</p>
                      </div>
                    )}
                    
                    {producto.codigo_barras && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Código de Barras</label>
                        <p className="text-gray-700">{producto.codigo_barras}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Categoría</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Tag className="w-3 h-3 mr-1" />
                        {producto.categorias?.nombre || 'Sin categoría'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Unidad de Medida</label>
                      <p className="text-gray-700">
                        {producto.unidades_medida?.nombre} ({producto.unidades_medida?.simbolo || 'unidades'})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                    <label className="text-sm font-medium text-green-700">Precio de Venta</label>
                    <p className="text-2xl font-bold text-green-900">${producto.precio.toLocaleString()}</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                    <label className="text-sm font-medium text-blue-700">Costo</label>
                    <p className="text-xl font-semibold text-blue-900">${producto.costo.toLocaleString()}</p>
                    <p className="text-sm text-blue-600">
                      Margen: {((producto.precio - producto.costo) / producto.precio * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 border ${
                    stockStatus.status === 'sin-stock' 
                      ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200'
                      : stockStatus.status === 'stock-bajo'
                      ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200'
                      : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
                  }`}>
                    <label className="text-sm font-medium text-gray-700">Stock Actual</label>
                    <p className="text-xl font-semibold text-gray-900">
                      {producto.stock} {producto.unidades_medida?.simbolo || 'unidades'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        Mín: {producto.stock_minimo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado y fechas */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Creado: {formatDate(producto.creado_en)}
                  </div>
                  {producto.actualizado_en !== producto.creado_en && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Actualizado: {formatDate(producto.actualizado_en)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'movimientos' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Movimientos de Inventario</h3>
                <span className="text-sm text-gray-500">Últimos movimientos registrados</span>
              </div>
              
              {loadingMovimientos ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-12">
                  <History className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium">No hay movimientos</p>
                  <p className="text-gray-400 text-sm">No se han registrado movimientos para este producto</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movimientos.map((movimiento) => (
                    <div key={movimiento.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          movimiento.tipos_movimiento_inventario?.incrementa_stock 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{movimiento.tipos_movimiento_inventario?.nombre || 'Movimiento'}</p>
                          <p className="text-sm text-gray-500">{movimiento.observaciones || 'Sin observaciones'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          movimiento.tipos_movimiento_inventario?.incrementa_stock 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {movimiento.tipos_movimiento_inventario?.incrementa_stock ? '+' : '-'}{movimiento.cantidad}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(movimiento.fecha)}</p>
                        <p className="text-xs text-gray-400">por {movimiento.usuarios?.nombre || 'Sistema'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recetas' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recetas</h3>
                <span className="text-sm text-gray-500">Insumos utilizados en este producto</span>
              </div>
              
              {loadingRecetas ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : recetas.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium">No hay recetas</p>
                  <p className="text-gray-400 text-sm">Este producto no tiene insumos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recetas.map((receta) => (
                    <div key={receta.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{receta.insumos?.nombre || 'Insumo'}</p>
                          <p className="text-sm text-gray-500">{receta.insumos?.descripcion || 'Sin descripción'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">
                          {receta.cantidad_por_unidad}{' '}
                          {('simbolo' in (receta.insumos?.unidades_medida ?? {}))
                            ? (receta.insumos?.unidades_medida as { simbolo?: string }).simbolo
                            : 'unidades'}
                        </p>
                        <p className="text-xs text-gray-400">por unidad</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ventas' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Ventas</h3>
                <span className="text-sm text-gray-500">Últimas ventas registradas</span>
              </div>
              
              {loadingVentas ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : ventas.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium">No hay ventas</p>
                  <p className="text-gray-400 text-sm">Este producto no ha sido vendido aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ventas.map((venta) => (
                    <div key={`${venta.venta_id}-${venta.id}`} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Venta #{venta.venta_id}</p>
                          <p className="text-sm text-gray-500">Cliente: {venta.ventas?.clientes?.nombre || 'Cliente general'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {venta.cantidad} × ${venta.precio_unitario.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          Total: ${venta.subtotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(venta.ventas?.fecha || '')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
