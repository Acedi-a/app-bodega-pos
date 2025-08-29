import React, { useEffect, useState } from 'react'
import { X, AlertTriangle, Package, BarChart3, Save, Calculator } from 'lucide-react'
import { perdidaService } from '../../services/PerdidaService'
import type { NuevaPerdida } from '../../types/perdidas'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const CrearPerdidaModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<NuevaPerdida>({
    tipo_item: 'producto',
    producto_id: null,
    insumo_id: null,
    cantidad: 1,
    valor_unitario: null,
    motivo: ''
  })
  
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string; precio: number; costo: number }>>([])
  const [insumos, setInsumos] = useState<Array<{ id: number; nombre: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      cargarDatos()
      resetForm()
    }
  }, [open])

  const cargarDatos = async () => {
    try {
      const [productosRes, insumosRes] = await Promise.all([
        perdidaService.getProductosActivos(),
        perdidaService.getInsumosActivos()
      ])
      
      setProductos(productosRes.data)
      setInsumos(insumosRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo_item: 'producto',
      producto_id: null,
      insumo_id: null,
      cantidad: 1,
      valor_unitario: null,
      motivo: ''
    })
    setError(null)
  }

  const handleTipoChange = (tipo: 'producto' | 'insumo') => {
    setFormData((prev: NuevaPerdida) => ({
      ...prev,
      tipo_item: tipo,
      producto_id: tipo === 'producto' ? prev.producto_id : null,
      insumo_id: tipo === 'insumo' ? prev.insumo_id : null,
      valor_unitario: null
    }))
  }

  const handleItemChange = async (itemId: number | null) => {
    const updates: Partial<NuevaPerdida> = {}
    
    if (formData.tipo_item === 'producto') {
      updates.producto_id = itemId
      const producto = productos.find(p => p.id === itemId)
      if (producto) {
        updates.valor_unitario = producto.costo
      }
    } else {
      updates.insumo_id = itemId
    }
    
    setFormData((prev: NuevaPerdida) => ({ ...prev, ...updates }))
  }

  const calcularValorTotal = () => {
    if (formData.cantidad && formData.valor_unitario) {
      return formData.cantidad * formData.valor_unitario
    }
    return 0
  }

  const getItemsActuales = () => {
    return formData.tipo_item === 'producto' ? productos : insumos
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!formData.cantidad || formData.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      if (formData.tipo_item === 'producto' && !formData.producto_id) {
        throw new Error('Debe seleccionar un producto')
      }

      if (formData.tipo_item === 'insumo' && !formData.insumo_id) {
        throw new Error('Debe seleccionar un insumo')
      }

      if (!formData.valor_unitario || formData.valor_unitario <= 0) {
        throw new Error('El valor unitario debe ser mayor a 0')
      }

      if (!formData.motivo?.trim()) {
        throw new Error('Debe especificar el motivo de la pérdida')
      }

      await perdidaService.crearPerdida(formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creando pérdida:', error)
      setError(error instanceof Error ? error.message : 'Error al crear la pérdida')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registrar Pérdida</h2>
              <p className="text-sm text-gray-500">Registre una nueva pérdida de inventario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Tipo de Item */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Item</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleTipoChange('producto')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors ${
                  formData.tipo_item === 'producto'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={loading}
              >
                <Package className="h-4 w-4" />
                Producto
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('insumo')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors ${
                  formData.tipo_item === 'insumo'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={loading}
              >
                <BarChart3 className="h-4 w-4" />
                Insumo
              </button>
            </div>
          </div>

          {/* Selección de Item */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {formData.tipo_item === 'producto' ? 'Producto' : 'Insumo'}
            </label>
            <select
              value={
                formData.tipo_item === 'producto' 
                  ? formData.producto_id || ''
                  : formData.insumo_id || ''
              }
              onChange={(e) => handleItemChange(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Seleccionar {formData.tipo_item}</option>
              {getItemsActuales().map(item => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                  {formData.tipo_item === 'producto' && 'precio' in item && ` - Costo: Bs. ${(item as any).costo?.toFixed(2) || '0.00'}`}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              value={formData.cantidad || ''}
              onChange={(e) => setFormData((prev: NuevaPerdida) => ({ ...prev, cantidad: Number(e.target.value) }))}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cantidad perdida"
              disabled={loading}
            />
          </div>

          {/* Valor Unitario */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Valor Unitario (Bs.)</label>
            <input
              type="number"
              value={formData.valor_unitario || ''}
              onChange={(e) => setFormData((prev: NuevaPerdida) => ({ ...prev, valor_unitario: Number(e.target.value) || null }))}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Valor unitario"
              disabled={loading}
            />
          </div>

          {/* Valor Total Calculado */}
          {formData.cantidad && formData.valor_unitario && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">
                  Valor Total: Bs. {calcularValorTotal().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Motivo de la Pérdida</label>
            <textarea
              value={formData.motivo || ''}
              onChange={(e) => setFormData((prev: NuevaPerdida) => ({ ...prev, motivo: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Describa el motivo de la pérdida..."
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? 'Registrando...' : 'Registrar Pérdida'}
          </button>
        </div>
      </div>
    </div>
  )
}
