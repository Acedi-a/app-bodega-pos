import { X, Calendar, Package, User, FileText, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import type { MovimientoInventario } from '../../types/inventario'

interface MovimientoDetailModalProps {
  movimiento: MovimientoInventario
  isOpen: boolean
  onClose: () => void
}

export default function MovimientoDetailModal({ 
  movimiento, 
  isOpen, 
  onClose 
}: MovimientoDetailModalProps) {
  if (!isOpen) return null

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTipoInfo = () => {
    if (!movimiento.tipos_movimiento_inventario) return { color: 'gray', icon: Package }
    
    const tipo = movimiento.tipos_movimiento_inventario
    const isIncrementa = tipo.incrementa_stock
    
    return {
      color: isIncrementa ? 'green' : 'red',
      icon: isIncrementa ? TrendingUp : TrendingDown,
      signo: isIncrementa ? '+' : '-'
    }
  }

  const tipoInfo = getTipoInfo()
  const Icon = tipoInfo.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-${tipoInfo.color}-100 rounded-lg flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${tipoInfo.color}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Movimiento de Inventario
              </h2>
              <p className="text-sm text-gray-500">
                #{movimiento.id} - {movimiento.tipos_movimiento_inventario?.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Información principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Producto */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Producto</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {movimiento.productos?.nombre || 'Producto eliminado'}
                  </p>
                  {movimiento.productos?.sku && (
                    <p className="text-sm text-gray-500 mt-1">
                      SKU: {movimiento.productos.sku}
                    </p>
                  )}
                  {movimiento.productos?.precio && (
                    <p className="text-sm text-gray-500 mt-1">
                      Precio: ${movimiento.productos.precio.toLocaleString()}
                    </p>
                  )}
                  {typeof movimiento.productos?.stock === 'number' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Stock actual: {movimiento.productos.stock.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Movimiento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 text-${tipoInfo.color}-500`} />
                  <h3 className="font-semibold text-gray-900">Movimiento</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {movimiento.tipos_movimiento_inventario?.nombre}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tipoInfo.color === 'green' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movimiento.tipos_movimiento_inventario?.incrementa_stock ? 'Incrementa' : 'Reduce'} stock
                    </span>
                  </div>
                  <p className={`text-2xl font-bold text-${tipoInfo.color}-600`}>
                    {tipoInfo.signo}{movimiento.cantidad.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    unidades
                  </p>
                </div>
              </div>
            </div>

            {/* Detalles adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha y hora */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Fecha y Hora</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {formatFecha(movimiento.fecha)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Registrado: {formatFecha(movimiento.creado_en)}
                  </p>
                </div>
              </div>

              {/* Usuario */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Usuario</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {movimiento.usuarios ? 
                      `${movimiento.usuarios.nombre} ${movimiento.usuarios.apellido || ''}`.trim() :
                      'Sistema automático'
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ID Usuario: {movimiento.usuario_id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Referencia */}
            {(movimiento.referencia_tipo || movimiento.referencia_id) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Referencia</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {movimiento.referencia_tipo && (
                    <p className="font-medium text-gray-900 mb-1">
                      Tipo: {movimiento.referencia_tipo.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                  {movimiento.referencia_id && (
                    <p className="text-sm text-gray-600">
                      ID: {movimiento.referencia_id}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notas */}
            {movimiento.notas && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Notas</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {movimiento.notas}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
