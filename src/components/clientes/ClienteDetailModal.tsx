import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, MapPin, CreditCard, Calendar, ShoppingBag } from 'lucide-react'
import { clienteService } from '../../services/ClienteService'
import type { Cliente, ClienteVenta } from '../../types/clientes'

interface ClienteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
}

export const ClienteDetailModal: React.FC<ClienteDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  cliente 
}) => {
  const [ventas, setVentas] = useState<ClienteVenta[]>([])
  const [loadingVentas, setLoadingVentas] = useState(false)

  useEffect(() => {
    if (cliente && isOpen) {
      loadVentas()
    }
  }, [cliente, isOpen])

  const loadVentas = async () => {
    if (!cliente) return
    
    setLoadingVentas(true)
    const { data } = await clienteService.getClienteVentas(cliente.id)
    setVentas(data)
    setLoadingVentas(false)
  }

  if (!isOpen || !cliente) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{cliente.nombre}</h2>
              <p className="text-sm text-gray-600">Detalles del cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información personal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">{cliente.nombre}</p>
                  </div>
                  {cliente.nit && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">NIT</label>
                      <p className="mt-1 text-sm text-gray-900">{cliente.nit}</p>
                    </div>
                  )}
                  {cliente.ci && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">CI</label>
                      <p className="mt-1 text-sm text-gray-900">{cliente.ci}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cliente.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Contacto
                </h3>
                <div className="space-y-3">
                  {cliente.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.direccion && (
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-sm text-gray-900">{cliente.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historial de ventas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Historial de Ventas
                </h3>
                {loadingVentas ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando historial...</p>
                  </div>
                ) : ventas.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay ventas registradas para este cliente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ventas.map((venta) => (
                      <div key={venta.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Venta #{venta.id}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(venta.fecha)} • {venta.productos_count} productos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            Bs. {venta.monto_total.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{venta.estado}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Información financiera */}
              <div className="bg-gradient-to-br from-amber-50 to-red-50 rounded-lg p-4 border border-amber-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Información Financiera
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Límite de Crédito:</span>
                    <span className="text-sm font-semibold text-green-600">
                      Bs. {cliente.cliente_info?.limite_credito?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Deuda Actual:</span>
                    <span className="text-sm font-semibold text-red-600">
                      Bs. {cliente.cliente_info?.deuda_actual?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                    <span className="text-sm font-medium text-gray-700">Crédito Disponible:</span>
                    <span className="text-sm font-semibold text-blue-600">
                      Bs. {((cliente.cliente_info?.limite_credito || 0) - (cliente.cliente_info?.deuda_actual || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {cliente.cliente_info?.condiciones_pago && (
                  <div className="mt-4 pt-3 border-t border-amber-200">
                    <label className="text-sm font-medium text-gray-700">Condiciones de Pago:</label>
                    <p className="mt-1 text-sm text-gray-600">{cliente.cliente_info.condiciones_pago}</p>
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Fechas
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registrado:</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(cliente.creado_en)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Última actualización:</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(cliente.actualizado_en)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
