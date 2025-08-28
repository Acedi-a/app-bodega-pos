import React, { useState, useEffect } from 'react'
import { Package, CheckCircle, AlertTriangle, DollarSign, Tag } from 'lucide-react'
import { productoService } from '../../services/ProductoService'
import type { ProductoStats } from '../../types/productos'

export const ProductoStatsCards: React.FC = () => {
  const [stats, setStats] = useState<ProductoStats>({
    totalProductos: 0,
    productosActivos: 0,
    productosStockBajo: 0,
    valorInventario: 0,
    categoriasPrincipales: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data } = await productoService.getProductoStats()
      setStats(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Productos */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalProductos.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Productos registrados</p>
        </div>

        {/* Productos Activos */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Activos
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.productosActivos.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Productos disponibles</p>
        </div>

        {/* Stock Bajo */}
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border border-red-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
              Stock Bajo
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.productosStockBajo.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Requieren reposición</p>
        </div>

        {/* Valor Inventario */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              Valor
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${stats.valorInventario.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600">Valor total inventario</p>
        </div>
      </div>

      {/* Categorías Principales */}
      {stats.categoriasPrincipales.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Categorías Principales</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.categoriasPrincipales.map((item, index) => (
              <div
                key={index}
                className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100"
              >
                <div className="text-lg font-bold text-purple-700 mb-1">
                  {item.count}
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  {item.categoria}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
