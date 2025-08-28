import React, { useMemo } from 'react'
import { Search, ShoppingCart, Eye, Edit2, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Venta, VentaFilter } from '../../types/ventas'

interface VentaTableProps {
  ventas: Venta[]
  loading: boolean
  filter: VentaFilter
  onFilterChange: (filter: VentaFilter) => void
  onView: (venta: Venta) => void
  onEdit: (venta: Venta) => void
  onDelete: (venta: Venta) => void
}

export const VentaTable: React.FC<VentaTableProps> = ({
  ventas,
  loading,
  filter,
  onFilterChange,
  onView,
  onEdit,
  onDelete
}) => {
  const filteredVentas = useMemo(() => {
    return ventas.filter(venta => {
      // Filtro por búsqueda
      if (filter.search && filter.search.trim() !== '') {
        const searchTerm = filter.search.toLowerCase()
        const matchesSearch = (
          venta.id.toString().includes(searchTerm) ||
          venta.terceros?.nombre.toLowerCase().includes(searchTerm) ||
          venta.notas?.toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }

      // Filtro por cliente
      if (filter.tercero_id && venta.tercero_id !== filter.tercero_id) return false

      // Filtro por método de pago
      if (filter.metodo_pago_id && venta.metodo_pago_id !== filter.metodo_pago_id) return false

      // Filtro por estado
      if (filter.estado_id && venta.estado_id !== filter.estado_id) return false

      // Filtro por rango de fechas
      if (filter.fecha_desde) {
        const fechaVenta = new Date(venta.fecha).getTime()
        const fechaDesde = new Date(filter.fecha_desde).getTime()
        if (fechaVenta < fechaDesde) return false
      }

      if (filter.fecha_hasta) {
        const fechaVenta = new Date(venta.fecha).getTime()
        const fechaHasta = new Date(filter.fecha_hasta).getTime()
        if (fechaVenta > fechaHasta) return false
      }

      // Filtro por rango de monto
      if (filter.monto_min !== undefined && venta.monto_total < filter.monto_min) return false
      if (filter.monto_max !== undefined && venta.monto_total > filter.monto_max) return false

      return true
    })
  }, [ventas, filter])

  const getEstadoInfo = (venta: Venta) => {
    const estado = venta.estados
    if (!estado) return { label: 'Sin estado', color: 'text-gray-600 bg-gray-100', icon: Clock }

    switch (estado.clave) {
      case 'completada':
        return { label: estado.nombre, color: 'text-green-600 bg-green-100', icon: CheckCircle }
      case 'cancelada':
        return { label: estado.nombre, color: 'text-red-600 bg-red-100', icon: XCircle }
      case 'pendiente':
        return { label: estado.nombre, color: 'text-amber-600 bg-amber-100', icon: Clock }
      default:
        return { label: estado.nombre, color: 'text-blue-600 bg-blue-100', icon: Clock }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
              placeholder="Buscar por ID, cliente o notas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter.search || ''}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            />
          </div>

          {/* Filtros de fechas */}
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="Desde"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filter.fecha_desde || ''}
              onChange={(e) => onFilterChange({ ...filter, fecha_desde: e.target.value })}
            />
            <input
              type="date"
              placeholder="Hasta"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filter.fecha_hasta || ''}
              onChange={(e) => onFilterChange({ ...filter, fecha_hasta: e.target.value })}
            />
          </div>

          {/* Filtros de monto */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Monto min"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filter.monto_min || ''}
              onChange={(e) => onFilterChange({ 
                ...filter, 
                monto_min: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
            <input
              type="number"
              placeholder="Monto max"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filter.monto_max || ''}
              onChange={(e) => onFilterChange({ 
                ...filter, 
                monto_max: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
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
            {filteredVentas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <ShoppingCart className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg font-medium mb-1">No hay ventas</p>
                  <p className="text-gray-400 text-sm">
                    No se encontraron ventas con los filtros aplicados
                  </p>
                </td>
              </tr>
            ) : (
              filteredVentas.map((venta) => {
                const estadoInfo = getEstadoInfo(venta)
                const IconEstado = estadoInfo.icon
                
                return (
                  <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">#{venta.id}</div>
                          <div className="text-sm text-gray-500">
                            {venta.venta_items?.length || 0} productos
                          </div>
                          {venta.notas && (
                            <div className="text-xs text-gray-400 line-clamp-1">{venta.notas}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {venta.terceros?.nombre || 'Cliente general'}
                        </div>
                        {venta.terceros?.nit && (
                          <div className="text-sm text-gray-500">NIT: {venta.terceros.nit}</div>
                        )}
                        {venta.terceros?.telefono && (
                          <div className="text-xs text-gray-400">{venta.terceros.telefono}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(venta.fecha)}</div>
                      <div className="text-xs text-gray-500">
                        por {venta.usuarios?.nombre || 'Usuario'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {venta.metodos_pago?.nombre || 'Sin método'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900">
                        ${venta.monto_total.toLocaleString()}
                      </div>
                      {venta.descuento > 0 && (
                        <div className="text-xs text-green-600">
                          Desc: -${venta.descuento.toLocaleString()}
                        </div>
                      )}
                      {venta.impuesto > 0 && (
                        <div className="text-xs text-gray-500">
                          Imp: +${venta.impuesto.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                        <IconEstado className="w-3 h-3 mr-1" />
                        {estadoInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(venta)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(venta)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(venta)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancelar"
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
      {filteredVentas.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {filteredVentas.length} de {ventas.length} ventas
            </p>
            <div className="text-sm text-gray-600">
              Total: ${filteredVentas.reduce((sum, v) => sum + v.monto_total, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
