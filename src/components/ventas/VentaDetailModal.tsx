import React, { useEffect, useState } from 'react'
import { X, ShoppingCart, User, Calendar, CreditCard, Phone, Mail, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import { ventaService } from '../../services/VentaService'
import type { Venta, VentaItem } from '../../types/ventas'

interface VentaDetailModalProps {
  ventaId: number | null
  isOpen: boolean
  onClose: () => void
}

export const VentaDetailModal: React.FC<VentaDetailModalProps> = ({
  ventaId,
  isOpen,
  onClose
}) => {
  const [venta, setVenta] = useState<Venta | null>(null)
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadVentaDetail = async () => {
      if (!ventaId || !isOpen) {
        setVenta(null)
        setVentaItems([])
        return
      }

      setLoading(true)
      try {
        const ventaData = await ventaService.getVenta(ventaId)
        if (ventaData) {
          setVenta(ventaData)
          setVentaItems(ventaData.venta_items || [])
        }
      } catch (error) {
        console.error('Error loading venta:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVentaDetail()
  }, [ventaId, isOpen])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? 'Cargando...' : `Venta #${venta?.id || ''}`}
              </h2>
              <p className="text-sm text-gray-500">Detalles completos de la venta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6 space-y-6">
              {/* Loading skeleton */}
              <div className="animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-200 h-32 rounded-lg"></div>
                    <div className="bg-gray-200 h-64 rounded-lg"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gray-200 h-48 rounded-lg"></div>
                    <div className="bg-gray-200 h-32 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : venta ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información principal */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Info básica de la venta */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Información de la Venta
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Fecha</p>
                          <p className="font-medium">{formatDate(venta.fecha)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Método de Pago</p>
                          <p className="font-medium">{venta.metodos_pago?.nombre || 'Sin método'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Vendedor</p>
                          <p className="font-medium">{venta.usuarios?.nombre || 'Usuario'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Estado */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Estado:</span>
                        {(() => {
                          const estadoInfo = getEstadoInfo(venta)
                          const IconEstado = estadoInfo.icon
                          return (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
                              <IconEstado className="w-4 h-4 mr-1" />
                              {estadoInfo.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Notas */}
                    {venta.notas && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Notas</p>
                            <p className="text-sm text-gray-700 mt-1">{venta.notas}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Productos */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Productos ({ventaItems.length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Producto
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Cantidad
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Precio Unit.
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Descuento
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ventaItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {item.productos?.nombre || 'Producto desconocido'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    SKU: {item.productos?.sku || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  {item.cantidad}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-900">
                                ${item.precio_unitario.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-gray-400">-</span>
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">
                                ${item.subtotal.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Información del cliente y resumen */}
                <div className="space-y-6">
                  {/* Cliente */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Cliente
                    </h3>
                    {venta.terceros ? (
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-gray-900">{venta.terceros.nombre}</p>
                          {venta.terceros.nit && (
                            <p className="text-sm text-gray-500">NIT: {venta.terceros.nit}</p>
                          )}
                        </div>
                        
                        {venta.terceros.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{venta.terceros.telefono}</span>
                          </div>
                        )}
                        
                        {venta.terceros.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{venta.terceros.email}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Cliente general</p>
                    )}
                  </div>

                  {/* Resumen financiero */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          ${(venta.monto_total - venta.impuesto + venta.descuento).toLocaleString()}
                        </span>
                      </div>
                      
                      {venta.descuento > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Descuento:</span>
                          <span className="font-medium text-green-600">
                            -${venta.descuento.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {venta.impuesto > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Impuestos:</span>
                          <span className="font-medium">
                            +${venta.impuesto.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-gray-900">
                            ${venta.monto_total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Venta creada: {formatDate(venta.fecha)}</p>
                      <p>ID de venta: {venta.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No se pudo cargar la información de la venta</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {venta && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {ventaItems.length} productos • Total: ${venta.monto_total.toLocaleString()}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
