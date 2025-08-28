import React, { useMemo } from 'react'
import { Search, Package, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import type { Producto, ProductoFilter } from '../../types/productos'

interface ProductoTableProps {
  productos: Producto[]
  loading: boolean
  filter: ProductoFilter
  onFilterChange: (filter: ProductoFilter) => void
  onView: (producto: Producto) => void
  onEdit: (producto: Producto) => void
  onDelete: (producto: Producto) => void
}

export const ProductoTable: React.FC<ProductoTableProps> = ({
  productos,
  loading,
  filter,
  onFilterChange,
  onView,
  onEdit,
  onDelete
}) => {
  const filteredProductos = useMemo(() => {
    return productos.filter(producto => {
      // Filtro por búsqueda
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.toLowerCase()
        const matchesSearch = (
          producto.nombre.toLowerCase().includes(searchTerm) ||
          producto.sku?.toLowerCase().includes(searchTerm) ||
          producto.descripcion?.toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }

      // Filtro por categoría
      if (filter.categoria_id) {
        if (producto.categoria_id !== filter.categoria_id) return false
      }

      // Filtro por rango de precio
      if (filter.precio_min !== undefined && producto.precio < filter.precio_min) return false
      if (filter.precio_max !== undefined && producto.precio > filter.precio_max) return false

      // Filtro por estado
      if (filter.activo !== undefined && producto.activo !== filter.activo) return false

      // Filtro por stock bajo
      if (filter.stock_bajo) {
        if (producto.stock > (producto.stock_minimo || 0)) return false
      }

      return true
    })
  }, [productos, filter])

  const getStockStatus = (producto: Producto) => {
    if (producto.stock <= 0) {
      return { status: 'sin-stock', label: 'Sin Stock', color: 'text-red-600 bg-red-100' }
    } else if (producto.stock <= (producto.stock_minimo || 0)) {
      return { status: 'stock-bajo', label: 'Stock Bajo', color: 'text-amber-600 bg-amber-100' }
    }
    return { status: 'normal', label: 'Normal', color: 'text-green-600 bg-green-100' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="w-64 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="w-48 h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter.search || ''}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            />
          </div>

          {/* Filtros adicionales */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Rango de precio */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Precio min"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={filter.precio_min || ''}
                onChange={(e) => onFilterChange({ 
                  ...filter, 
                  precio_min: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
              <input
                type="number"
                placeholder="Precio max"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={filter.precio_max || ''}
                onChange={(e) => onFilterChange({ 
                  ...filter, 
                  precio_max: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>

            {/* Solo stock bajo */}
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filter.stock_bajo || false}
                onChange={(e) => onFilterChange({ ...filter, stock_bajo: e.target.checked })}
              />
              Stock bajo
            </label>

            {/* Solo activos */}
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={filter.activo === true}
                onChange={(e) => onFilterChange({ 
                  ...filter, 
                  activo: e.target.checked ? true : undefined 
                })}
              />
              Solo activos
            </label>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProductos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Package className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium mb-1">No hay productos</p>
                  <p className="text-gray-400 text-sm">
                    No se encontraron productos con los filtros aplicados
                  </p>
                </td>
              </tr>
            ) : (
              filteredProductos.map((producto) => {
                const stockStatus = getStockStatus(producto)
                return (
                  <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                          {producto.sku && (
                            <div className="text-sm text-gray-500">SKU: {producto.sku}</div>
                          )}
                          {producto.descripcion && (
                            <div className="text-sm text-gray-500 line-clamp-1">{producto.descripcion}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {producto.categorias?.nombre || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${producto.precio.toLocaleString()}
                      </div>
                      {producto.costo && (
                        <div className="text-xs text-gray-500">
                          Costo: ${producto.costo.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {producto.stock} {producto.unidades_medida?.simbolo || 'unidades'}
                          </span>
                          {stockStatus.status !== 'normal' && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        producto.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(producto)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(producto)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(producto)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con info */}
      {filteredProductos.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {filteredProductos.length} de {productos.length} productos
          </p>
        </div>
      )}
    </div>
  )
}
