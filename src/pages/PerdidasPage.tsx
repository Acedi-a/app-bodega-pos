import React, { useState, useEffect } from 'react'
import { AlertTriangle, Plus, TrendingDown, DollarSign, Package, BarChart3 } from 'lucide-react'
import { ListadoPerdidas } from '../components/perdidas/ListadoPerdidas'
import { CrearPerdidaModal } from '../components/perdidas/CrearPerdidaModal'
import { perdidaService } from '../services/PerdidaService'
import type { ResumenPerdidas } from '../types/perdidas'

export const PerdidasPage: React.FC = () => {
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false)
  const [resumen, setResumen] = useState<ResumenPerdidas | null>(null)
  const [keyListado, setKeyListado] = useState(0)

  useEffect(() => {
    cargarResumen()
  }, [])

  const cargarResumen = async () => {
    try {
      const resumenData = await perdidaService.getResumenPerdidas()
      setResumen(resumenData)
    } catch (error) {
      console.error('Error cargando resumen:', error)
    }
  }

  const handleCrearPerdida = () => {
    setKeyListado(prev => prev + 1) // Forzar recarga del listado
    cargarResumen()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Pérdidas</h1>
                <p className="text-gray-600">Control y registro de pérdidas de inventario</p>
              </div>
            </div>
            
            <button
              onClick={() => setMostrarModalCrear(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Registrar Pérdida
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tarjetas de Resumen */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Pérdidas */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pérdidas</p>
                  <p className="text-2xl font-bold text-gray-900">{resumen.totalItems}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Valor Total */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-red-600">
                    Bs. {resumen.valorTotalGeneral?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Pérdidas de Productos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos</p>
                  <p className="text-2xl font-bold text-blue-600">{resumen.perdidasPorTipo.productos.cantidad}</p>
                  <p className="text-sm text-gray-500">
                    Bs. {resumen.perdidasPorTipo.productos.valor?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pérdidas de Insumos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Insumos</p>
                  <p className="text-2xl font-bold text-purple-600">{resumen.perdidasPorTipo.insumos.cantidad}</p>
                  <p className="text-sm text-gray-500">
                    Bs. {resumen.perdidasPorTipo.insumos.valor?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Items con Pérdidas */}
        {resumen?.topPerdidas && resumen.topPerdidas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Items con Más Pérdidas</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {resumen.topPerdidas.slice(0, 5).map((item, index) => (
                  <div key={`${item.tipo}-${item.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.nombre}</p>
                        <p className="text-sm text-gray-500 capitalize">{item.tipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">{item.cantidadTotal}</p>
                      <p className="text-sm text-gray-500">
                        Bs. {item.valorTotal?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-400">{item.frecuencia} registros</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Listado Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <ListadoPerdidas key={keyListado} />
        </div>
      </div>

      {/* Modal de Crear Pérdida */}
      <CrearPerdidaModal
        open={mostrarModalCrear}
        onClose={() => setMostrarModalCrear(false)}
        onSuccess={handleCrearPerdida}
      />
    </div>
  )
}
