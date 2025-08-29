import React, { useMemo } from 'react'
import { Search, Package, Eye, Edit2, Trash2, Filter } from 'lucide-react'
import type { Insumo, InsumoFilter, UnidadMedida } from '../../types/insumos'

interface InsumoTableProps {
  insumos: Insumo[]
  loading: boolean
  filter: InsumoFilter
  unidades: UnidadMedida[]
  onFilterChange: (filter: InsumoFilter) => void
  onView: (insumo: Insumo) => void
  onEdit: (insumo: Insumo) => void
  onDelete: (insumo: Insumo) => void
  onAdjustStock: (insumo: Insumo) => void
}

export const InsumoTable: React.FC<InsumoTableProps> = ({
  insumos,
  loading,
  filter,
  unidades,
  onFilterChange,
  onView,
  onEdit,
  onDelete,
  onAdjustStock
}) => {
  const filtered = useMemo(() => {
    return insumos.filter((i) => {
      if (filter.search && filter.search.trim() !== '') {
        const s = filter.search.toLowerCase().trim()
        const matches = (
          i.nombre.toLowerCase().includes(s) ||
          (i.descripcion || '').toLowerCase().includes(s)
        )
        if (!matches) return false
      }

      if (filter.unidad_medida_id && i.unidad_medida_id !== filter.unidad_medida_id) return false

      if (filter.activo !== undefined && i.activo !== filter.activo) return false

      if (filter.stock_bajo) {
        if ((i.stock || 0) > (i.stock_minimo || 0)) return false
      }

      return true
    })
  }, [insumos, filter])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="w-64 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
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
              placeholder="Buscar por nombre o descripción..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter.search || ''}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            />
          </div>

          {/* Unidad y checkboxes */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                value={filter.unidad_medida_id || ''}
                onChange={(e) => onFilterChange({
                  ...filter,
                  unidad_medida_id: e.target.value ? Number(e.target.value) : undefined
                })}
              >
                <option value="">Todas las unidades</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filter.stock_bajo || false}
                onChange={(e) => onFilterChange({ ...filter, stock_bajo: e.target.checked })}
              />
              Stock bajo
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={filter.activo === true}
                onChange={(e) => onFilterChange({ ...filter, activo: e.target.checked ? true : undefined })}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Package className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium mb-1">No hay insumos</p>
                  <p className="text-gray-400 text-sm">No se encontraron insumos con los filtros aplicados</p>
                </td>
              </tr>
            ) : (
              filtered.map((i) => {
                const status = i.stock <= 0 ? (
                  { color: 'bg-red-100 text-red-800', label: 'Sin stock' }
                ) : (i.stock <= (i.stock_minimo || 0) ? (
                  { color: 'bg-amber-100 text-amber-800', label: 'Stock bajo' }
                ) : (
                  { color: 'bg-green-100 text-green-800', label: 'Normal' }
                ))

                return (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-red-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{i.nombre}</div>
                          {i.descripcion && (
                            <div className="text-sm text-gray-500 line-clamp-1">{i.descripcion}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {i.unidades_medida?.nombre || 'Sin unidad'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{i.stock} {i.unidades_medida?.clave || ''}</div>
                      {i.stock_minimo !== undefined && (
                        <div className="text-xs text-gray-500">Mínimo: {i.stock_minimo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(i)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(i)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAdjustStock(i)}
                          className="px-2 py-1 text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => onDelete(i)}
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

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">Mostrando {filtered.length} de {insumos.length} insumos</p>
        </div>
      )}
    </div>
  )
}
