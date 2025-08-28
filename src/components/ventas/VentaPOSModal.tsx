import React, { useState, useEffect, useMemo } from 'react'
import { X, Plus, Minus, Trash2, ShoppingCart, Search, Calculator, CreditCard, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ventaService } from '../../services/VentaService'
import type { CarritoVenta, CarritoItem, CreateVentaData, MetodoPago, Cliente } from '../../types/ventas'
import type { Producto } from '../../types/productos'

interface VentaPOSModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export const VentaPOSModal: React.FC<VentaPOSModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [carrito, setCarrito] = useState<CarritoVenta>({
    items: [],
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    total: 0,
    metodo_pago_id: 1
  })

  // Datos del formulario
  const [clienteId, setClienteId] = useState<number | undefined>(undefined)
  const [metodoPagoId, setMetodoPagoId] = useState(1)
  const [notas, setNotas] = useState('')
  
  // Datos para selects
  const [productos, setProductos] = useState<Producto[]>([])
  const [metodsPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  // Filtros de productos
  const productosFiltered = useMemo(() => {
    if (!searchTerm.trim()) return productos.slice(0, 20) // Mostrar solo los primeros 20
    
    return productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20)
  }, [productos, searchTerm])

  useEffect(() => {
    if (isOpen) {
      loadCatalogs()
      resetCarrito()
    }
  }, [isOpen])

  useEffect(() => {
    calculateTotal()
  }, [carrito.items, carrito.descuento, carrito.impuesto])

  const loadCatalogs = async () => {
    try {
      const [productosData, metodosData, clientesData] = await Promise.all([
        ventaService.buscarProductosParaVenta(''),
        ventaService.getMetodosPago(),
        ventaService.getClientes()
      ])
      
      setProductos(productosData.data)
      setMetodosPago(metodosData.data)
      console.log("Listar metodos")
      console.log("metodos: ", metodosData.data)
      setClientes(clientesData.data)
    } catch (error) {
      console.error('Error loading catalogs:', error)
    }
  }

  const resetCarrito = () => {
    setCarrito({
      items: [],
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      metodo_pago_id: 1
    })
    setClienteId(undefined)
    setMetodoPagoId(1)
    setNotas('')
    setSearchTerm('')
  }

  const addToCarrito = (producto: Producto) => {
    const existingItemIndex = carrito.items.findIndex(item => item.producto_id === producto.id)
    
    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar cantidad
      updateItemQuantity(producto.id, carrito.items[existingItemIndex].cantidad + 1)
    } else {
      // Agregar nuevo item
      const newItem: CarritoItem = {
        producto_id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku || '',
        cantidad: 1,
        precio_unitario: producto.precio,
        subtotal: producto.precio,
        stock_disponible: producto.stock
      }
      
      setCarrito(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
    }
  }

  const updateItemQuantity = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCarrito(productoId)
      return
    }

    setCarrito(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.producto_id === productoId
          ? { ...item, cantidad, subtotal: cantidad * item.precio_unitario }
          : item
      )
    }))
  }

  const updateItemPrice = (productoId: number, precio: number) => {
    setCarrito(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.producto_id === productoId
          ? { ...item, precio_unitario: precio, subtotal: item.cantidad * precio }
          : item
      )
    }))
  }

  const removeFromCarrito = (productoId: number) => {
    setCarrito(prev => ({
      ...prev,
      items: prev.items.filter(item => item.producto_id !== productoId)
    }))
  }

  const calculateTotal = () => {
    const subtotal = carrito.items.reduce((sum, item) => sum + item.subtotal, 0)
    const total = subtotal - carrito.descuento + carrito.impuesto
    
    setCarrito(prev => ({
      ...prev,
      subtotal,
      total
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (carrito.items.length === 0) {
      alert('Debes agregar al menos un producto')
      return
    }

    setLoading(true)
    try {
      // Verificar que tenemos un usuario autenticado
      if (!user?.id) {
        alert('Error: Usuario no autenticado. Por favor, vuelve a iniciar sesión.')
        setLoading(false)
        return
      }

      // Obtener el ID del estado 'completada'
      const estadoCompletadaId = await ventaService.getEstadoCompletadaId()

      const ventaData: CreateVentaData = {
        tercero_id: clienteId || undefined, // Si no hay cliente, enviar undefined (se guardará como null)
        usuario_id: user.id, // Usar el ID del usuario autenticado
        monto_total: carrito.total,
        descuento: carrito.descuento,
        impuesto: carrito.impuesto,
        metodo_pago_id: metodoPagoId,
        estado_id: estadoCompletadaId, // Usar el ID correcto del estado completada
        notas: notas || undefined,
        items: carrito.items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        }))
      }

      const result = await ventaService.createVenta(ventaData)
      
      if (result.error) {
        // Manejar errores específicos
        if (result.error.code === '23503') {
          if (result.error.message.includes('usuario_id')) {
            alert('Error: Usuario no encontrado en la base de datos. Contacta al administrador.')
          } else if (result.error.message.includes('tercero_id')) {
            alert('Error: Cliente no válido. Verifica la información del cliente.')
          } else if (result.error.message.includes('metodo_pago_id')) {
            alert('Error: Método de pago no válido.')
          } else if (result.error.message.includes('estado_id')) {
            alert('Error: Estado no válido.')
          } else {
            alert('Error: Referencias no válidas en la venta.')
          }
        } else {
          alert(`Error al crear la venta: ${result.error.message}`)
        }
        return
      }

      // Si llegamos aquí, la venta se creó exitosamente
      alert('Venta creada exitosamente')
      onSave()
      onClose()
      resetCarrito()
    } catch (error: any) {
      console.error('Error creating venta:', error)
      
      // Manejo de errores de red o inesperados
      if (error?.message) {
        alert(`Error inesperado: ${error.message}`)
      } else {
        alert('Error inesperado al crear la venta. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-7xl h-[90vh] overflow-hidden flex">
        {/* Panel izquierdo - Productos */}
        <div className="flex-1 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Punto de Venta</h2>
            
            {/* Búsqueda de productos */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos por nombre o SKU..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {productosFiltered.map((producto) => (
                <div
                  key={producto.id}
                  onClick={() => addToCarrito(producto)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                    {producto.nombre}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      ${producto.precio.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Stock: {producto.stock}
                    </span>
                  </div>
                  {producto.sku && (
                    <div className="text-xs text-gray-400 mt-1">
                      SKU: {producto.sku}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {productosFiltered.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron productos</p>
                <p className="text-sm text-gray-400">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Carrito */}
        <div className="w-96 flex flex-col">
          {/* Header del carrito */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Carrito ({carrito.items.length})
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-auto p-4">
            {carrito.items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Carrito vacío</p>
                <p className="text-sm text-gray-400">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.items.map((item) => (
                  <div key={item.producto_id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.nombre}
                        </h4>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCarrito(item.producto_id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => updateItemQuantity(item.producto_id, item.cantidad - 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateItemQuantity(item.producto_id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center text-sm border-0 focus:outline-none"
                        />
                        <button
                          onClick={() => updateItemQuantity(item.producto_id, item.cantidad + 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precio_unitario}
                        onChange={(e) => updateItemPrice(item.producto_id, parseFloat(e.target.value) || 0)}
                        className="flex-1 text-right text-sm p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="text-right mt-2">
                      <span className="font-medium text-gray-900">
                        ${item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con totales y checkout */}
          {carrito.items.length > 0 && (
            <form onSubmit={handleSubmit} className="border-t border-gray-200">
              {/* Configuración de venta */}
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Cliente
                  </label>
                  <select
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={clienteId || ''}
                    onChange={(e) => setClienteId(e.target.value ? parseInt(e.target.value) : undefined)}
                  >
                    <option value="">Cliente general</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Método de Pago
                  </label>
                  <select
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={metodoPagoId}
                    onChange={(e) => setMetodoPagoId(parseInt(e.target.value))}
                    required
                  >
                    {metodsPago.map(metodo => (
                      <option key={metodo.id} value={metodo.id}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Descuento</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={carrito.descuento}
                      onChange={(e) => setCarrito(prev => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Impuesto</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={carrito.impuesto}
                      onChange={(e) => setCarrito(prev => ({ ...prev, impuesto: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <textarea
                    rows={2}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
              </div>

              {/* Totales */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${carrito.subtotal.toLocaleString()}</span>
                  </div>
                  
                  {carrito.descuento > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="text-red-600">-${carrito.descuento.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {carrito.impuesto > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impuesto:</span>
                      <span className="text-green-600">+${carrito.impuesto.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ${carrito.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Botón de checkout */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  {loading ? 'Procesando...' : 'Procesar Venta'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
