import React, { useState, useEffect } from 'react'
import { Download, Filter, RefreshCw, ShoppingCart } from 'lucide-react'
import { VentaStatsCards } from '../components/ventas/VentaStatsCards'
import { VentaTable } from '../components/ventas/VentaTable'
import { VentaDetailModal } from '../components/ventas/VentaDetailModal'
import { VentaModal } from '../components/ventas/VentaModal'
import { VentaPOSModal } from '../components/ventas/VentaPOSModal'
import { ventaService } from '../services/VentaService'
import type { Venta, VentaFilter } from '../types/ventas'

export const VentasPage: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Estados para filtros
  const [filter, setFilter] = useState<VentaFilter>({})
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados para modales
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPOSModal, setShowPOSModal] = useState(false)

  useEffect(() => {
    loadVentas()
  }, [])

  const loadVentas = async () => {
    setLoading(true)
    try {
      const response = await ventaService.getVentas(1, 100, filter)
      setVentas(response.data)
    } catch (error) {
      console.error('Error loading ventas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadVentas()
    setRefreshing(false)
  }

  const handleFilterChange = (newFilter: VentaFilter) => {
    setFilter(newFilter)
    // Aplicar filtros automáticamente
    setTimeout(() => {
      loadVentas()
    }, 300)
  }

  const handleView = (venta: Venta) => {
    setSelectedVenta(venta)
    setShowDetailModal(true)
  }

  const handleEdit = (venta: Venta) => {
    setSelectedVenta(venta)
    setShowEditModal(true)
  }

  const handleDelete = async (venta: Venta) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la venta #${venta.id}?`)) {
      return
    }

    try {
      // En lugar de eliminar, cambiar el estado a cancelada
      await ventaService.updateVenta(venta.id, {
        monto_total: venta.monto_total,
        metodo_pago_id: venta.metodo_pago_id,
        descuento: venta.descuento,
        impuesto: venta.impuesto,
        estado_id: 3, // Asumiendo que 3 es el ID de estado 'cancelada'
        notas: venta.notas
      })
      loadVentas()
    } catch (error) {
      console.error('Error cancelando venta:', error)
      alert('Error al cancelar la venta')
    }
  }

  const handleSave = () => {
    loadVentas()
    setSelectedVenta(null)
    setShowEditModal(false)
    setShowCreateModal(false)
    setShowPOSModal(false)
  }

  const handleExport = () => {
    // Crear CSV con los datos de ventas
    const csvContent = [
      ['ID', 'Fecha', 'Cliente', 'Total', 'Método Pago', 'Estado'].join(','),
      ...ventas.map(venta => [
        venta.id,
        new Date(venta.fecha).toLocaleDateString('es-ES'),
        venta.terceros?.nombre || 'Cliente general',
        venta.monto_total,
        venta.metodos_pago?.nombre || 'Sin método',
        venta.estados?.nombre || 'Sin estado'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
                  <p className="text-gray-600">Gestiona las ventas y transacciones de la bodega</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              
              <button
                onClick={handleExport}
                disabled={ventas.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              <button
                onClick={() => setShowPOSModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Punto de Venta
              </button>
            
            </div>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avanzados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha desde
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter.fecha_desde || ''}
                  onChange={(e) => handleFilterChange({ ...filter, fecha_desde: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter.fecha_hasta || ''}
                  onChange={(e) => handleFilterChange({ ...filter, fecha_hasta: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter.monto_min || ''}
                  onChange={(e) => handleFilterChange({ 
                    ...filter, 
                    monto_min: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto máximo
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="1000000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter.monto_max || ''}
                  onChange={(e) => handleFilterChange({ 
                    ...filter, 
                    monto_max: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setFilter({})
                  loadVentas()
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="mb-8">
          <VentaStatsCards />
        </div>

        {/* Tabla de ventas */}
        <VentaTable
          ventas={ventas}
          loading={loading}
          filter={filter}
          onFilterChange={handleFilterChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Modales */}
        <VentaDetailModal
          ventaId={selectedVenta?.id || null}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedVenta(null)
          }}
        />

        <VentaModal
          venta={selectedVenta}
          isOpen={showEditModal || showCreateModal}
          onClose={() => {
            setShowEditModal(false)
            setShowCreateModal(false)
            setSelectedVenta(null)
          }}
          onSave={handleSave}
        />

        <VentaPOSModal
          isOpen={showPOSModal}
          onClose={() => setShowPOSModal(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
