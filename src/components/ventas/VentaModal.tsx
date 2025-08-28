import React, { useState, useEffect } from 'react'
import { X, ShoppingCart, Plus, Trash2, Save, User, CreditCard, FileText } from 'lucide-react'
import { ventaService } from '../../services/VentaService'
import type { Venta, UpdateVentaData, MetodoPago, EstadoVenta, Cliente, VentaItem } from '../../types/ventas'
import type { Producto } from '../../types/productos'

interface VentaModalProps {
  venta: Venta | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export const VentaModal: React.FC<VentaModalProps> = ({
  venta,
  isOpen,
  onClose,
  onSave
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UpdateVentaData>({
    tercero_id: undefined,
    monto_total: 0,
    metodo_pago_id: 1,
    estado_id: 1,
    descuento: 0,
    impuesto: 0,
    notas: ''
  })
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([])
  
  // Datos para selects
  const [metodsPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [estados, setEstados] = useState<EstadoVenta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  // Estados para agregar productos
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [newItemCantidad, setNewItemCantidad] = useState(1)
  const [newItemPrecio, setNewItemPrecio] = useState(0)


  useEffect(() => {
    if (isOpen && venta) {
      console.log('🔄 Cargando datos de venta para edición:', {
        ventaId: venta.id,
        itemsOriginales: venta.venta_items?.length || 0,
        items: venta.venta_items
      })
      
      setFormData({
        tercero_id: venta.tercero_id,
        monto_total: venta.monto_total,
        metodo_pago_id: venta.metodo_pago_id,
        estado_id: venta.estado_id,
        descuento: venta.descuento,
        impuesto: venta.impuesto,
        notas: venta.notas || ''
      })
      
      // Crear una copia fresca de los items para evitar referencias compartidas
      const itemsCopy = (venta.venta_items || []).map(item => ({ ...item }))
      setVentaItems(itemsCopy)
      loadCatalogs()
    } else if (!venta) {
      // Resetear para nueva venta
      setFormData({
        tercero_id: undefined,
        monto_total: 0,
        metodo_pago_id: 1,
        estado_id: 1,
        descuento: 0,
        impuesto: 0,
        notas: ''
      })
      setVentaItems([])
    }
  }, [isOpen, venta])

  const loadCatalogs = async () => {
    try {
      const [metodosData, estadosData, clientesData, productosData] = await Promise.all([
        ventaService.getMetodosPago(),
        ventaService.getEstadosVenta(),
        ventaService.getClientes(),
        ventaService.buscarProductosParaVenta('')
      ])
      
      setMetodosPago(metodosData.data)
      setEstados(estadosData.data)
      setClientes(clientesData.data)
      setProductos(productosData.data)
    } catch (error) {
      console.error('Error loading catalogs:', error)
    }
  }

  const handleAddProduct = () => {
    if (!selectedProducto) return

    // Generar ID temporal único (mayor a 1000000 para identificarlo fácilmente)
    const tempId = 1000000 + Date.now() + Math.floor(Math.random() * 1000)

    const newItem: VentaItem = {
      id: tempId, // ID temporal único
      venta_id: venta?.id || 0,
      producto_id: selectedProducto.id,
      cantidad: newItemCantidad,
      precio_unitario: newItemPrecio || selectedProducto.precio,
      subtotal: newItemCantidad * (newItemPrecio || selectedProducto.precio),
      creado_en: new Date().toISOString(),
      productos: selectedProducto
    }

    setVentaItems([...ventaItems, newItem])
    setShowAddProduct(false)
    setSelectedProducto(null)
    setNewItemCantidad(1)
    setNewItemPrecio(0)
  }

  const handleRemoveItem = (itemId: number) => {
    setVentaItems(ventaItems.filter(item => item.id !== itemId))
  }

  const handleItemChange = (itemId: number, field: 'cantidad' | 'precio_unitario', value: number) => {
    setVentaItems(ventaItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value }
        updated.subtotal = updated.cantidad * updated.precio_unitario
        return updated
      }
      return item
    }))
  }

  const calculateTotal = () => {
    const subtotal = ventaItems.reduce((sum, item) => sum + item.subtotal, 0)
    return subtotal - formData.descuento + formData.impuesto
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!venta) return

    console.log('💾 Guardando venta:', {
      ventaId: venta.id,
      itemsActuales: ventaItems.length,
      itemsOriginales: venta.venta_items?.length || 0,
      items: ventaItems.map(item => ({
        id: item.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        isNew: item.id > 1000000 || !venta.venta_items?.some(originalItem => originalItem.id === item.id)
      }))
    })

    setLoading(true)
    try {
      const updatedData: UpdateVentaData = {
        ...formData,
        monto_total: calculateTotal(),
        items: ventaItems.map(item => {
          // Un item es nuevo si su ID es mayor que 1000000 (temporal) o si no existe en los items originales
          const isNewItem = item.id > 1000000 || !venta.venta_items?.some(originalItem => originalItem.id === item.id)
          
          return {
            id: isNewItem ? undefined : item.id,
            producto_id: item.producto_id || 0,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          }
        })
      }

      const result = await ventaService.updateVenta(venta.id, updatedData)
      
      if (result.error) {
        console.error('Error actualizando venta:', result.error)
        alert('Error al actualizar la venta. Revisa la consola para más detalles.')
        return
      }

      alert('Venta actualizada exitosamente')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error updating venta:', error)
      alert(`Error inesperado: ${error?.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {venta ? `Editar Venta #${venta.id}` : 'Nueva Venta'}
              </h2>
              <p className="text-sm text-gray-500">Modifica los detalles de la venta</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Info básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Cliente
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tercero_id || ''}
                  onChange={(e) => setFormData({ ...formData, tercero_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Cliente general</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.nit ? `(${cliente.nit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Método de Pago
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.metodo_pago_id}
                  onChange={(e) => setFormData({ ...formData, metodo_pago_id: parseInt(e.target.value) })}
                  required
                >
                  {metodsPago.map(metodo => (
                    <option key={metodo.id} value={metodo.id}>
                      {metodo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.estado_id}
                  onChange={(e) => setFormData({ ...formData, estado_id: parseInt(e.target.value) })}
                  required
                >
                  {estados.map(estado => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.descuento}
                  onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impuesto
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.impuesto}
                  onChange={(e) => setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notas
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales sobre la venta..."
              />
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Productos ({ventaItems.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </button>
              </div>

              {/* Lista de productos */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {ventaItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Precio
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Subtotal
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ventaItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.productos?.nombre}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {item.productos?.sku}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="1"
                                className="w-20 p-1 border border-gray-300 rounded text-center"
                                value={item.cantidad}
                                onChange={(e) => handleItemChange(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 p-1 border border-gray-300 rounded text-center"
                                value={item.precio_unitario}
                                onChange={(e) => handleItemChange(item.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              ${item.subtotal.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p>No hay productos agregados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen total */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || ventaItems.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* Modal para agregar producto */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Agregar Producto</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProducto?.id || ''}
                    onChange={(e) => {
                      const producto = productos.find(p => p.id === parseInt(e.target.value))
                      setSelectedProducto(producto || null)
                      setNewItemPrecio(producto?.precio || 0)
                    }}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} - ${producto.precio.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newItemCantidad}
                    onChange={(e) => setNewItemCantidad(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio unitario
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newItemPrecio}
                    onChange={(e) => setNewItemPrecio(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {selectedProducto && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      Subtotal: ${(newItemCantidad * newItemPrecio).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false)
                    setSelectedProducto(null)
                    setNewItemCantidad(1)
                    setNewItemPrecio(0)
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProducto}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
