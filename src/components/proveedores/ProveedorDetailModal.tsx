import React, { useState, useEffect } from 'react'
import { X, Mail, Phone, MapPin, Building, User, CreditCard, Calendar, Star, ShoppingCart } from 'lucide-react'
import { proveedorService } from '../../services/ProveedorService'
import type { Proveedor, ProveedorCompra } from '../../types/proveedores'

interface ProveedorDetailModalProps {
  isOpen: boolean
  onClose: () => void
  proveedor: Proveedor | null
}

export const ProveedorDetailModal: React.FC<ProveedorDetailModalProps> = ({
  isOpen,
  onClose,
  proveedor
}) => {
  const [compras, setCompras] = useState<ProveedorCompra[]>([])
  const [loadingCompras, setLoadingCompras] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'compras'>('info')

  useEffect(() => {
    if (isOpen && proveedor) {
      loadCompras()
    }
  }, [isOpen, proveedor])

  const loadCompras = async () => {
    if (!proveedor) return
    
    setLoadingCompras(true)
    try {
      const { data } = await proveedorService.getProveedorCompras(proveedor.id.toString())
      setCompras(data)
    } catch (error) {
      console.error('Error cargando compras:', error)
    } finally {
      setLoadingCompras(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completada':
        return 'bg-green-100 text-green-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCondicionPagoText = (condicion?: string) => {
    const condiciones: Record<string, string> = {
      'contado': 'Contado',
      'credito_15': 'Crédito 15 días',
      'credito_30': 'Crédito 30 días',
      'credito_45': 'Crédito 45 días',
      'credito_60': 'Crédito 60 días'
    }
    return condiciones[condicion || ''] || condicion || 'No especificada'
  }

  if (!isOpen || !proveedor) return null

  const totalCompras = compras.reduce((sum, compra) => sum + compra.monto_total, 0)
  const comprasCompletadas = compras.filter(c => c.estado.toLowerCase() === 'completada').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{proveedor.nombre}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Registrado el {formatDate(proveedor.creado_en)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              proveedor.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {proveedor.activo ? 'Activo' : 'Inactivo'}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Información General
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'compras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial de Compras
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Información básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nombre</p>
                      <p className="text-sm text-gray-600">{proveedor.nombre}</p>
                    </div>
                  </div>

                  {proveedor.nit && (
                    <div className="flex items-start space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">NIT</p>
                        <p className="text-sm text-gray-600">{proveedor.nit}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.ci && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">CI</p>
                        <p className="text-sm text-gray-600">{proveedor.ci}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{proveedor.email}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.telefono && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Teléfono</p>
                        <p className="text-sm text-gray-600">{proveedor.telefono}</p>
                      </div>
                    </div>
                  )}

                  {proveedor.direccion && (
                    <div className="flex items-start space-x-3 md:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dirección</p>
                        <p className="text-sm text-gray-600">{proveedor.direccion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información comercial */}
              {proveedor.proveedor_info && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Comercial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {proveedor.proveedor_info.contacto && (
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Contacto Principal</p>
                          <p className="text-sm text-gray-600">{proveedor.proveedor_info.contacto}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Condición de Pago</p>
                        <p className="text-sm text-gray-600">
                          {getCondicionPagoText(proveedor.proveedor_info.condicion_pago)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen de compras */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Compras</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <ShoppingCart className="w-8 h-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Total Compras</p>
                        <p className="text-2xl font-bold text-blue-600">{compras.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="w-8 h-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-900">Completadas</p>
                        <p className="text-2xl font-bold text-green-600">{comprasCompletadas}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="w-8 h-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-900">Total Monto</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCompras)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compras' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Historial de Compras</h3>
                <div className="text-sm text-gray-500">
                  {compras.length} compras registradas
                </div>
              </div>

              {loadingCompras ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : compras.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay compras registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {compras.map((compra) => (
                    <div
                      key={compra.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              Compra #{compra.id}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(compra.estado)}`}>
                              {compra.estado}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Fecha:</span> {formatDate(compra.fecha)}
                            </div>
                            <div>
                              <span className="font-medium">Productos:</span> {compra.productos_count}
                            </div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(compra.monto_total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}