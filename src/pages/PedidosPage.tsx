import React, { useEffect, useMemo, useState } from 'react'
import { pedidoService } from '../services/PedidoService'
import { productoService } from '../services/ProductoService'
import type { NuevoPedidoInput, DisponibilidadPedido } from '../types/pedidos'
import { Calendar, CheckCircle2, Package, XCircle, Plus, Minus, Save, User, ShoppingBag, RotateCcw, AlertTriangle, Info, X } from 'lucide-react'
import { ListadoPedidos } from '../components/pedidos/ListadoPedidos'

const PedidosPage: React.FC = () => {
  // Estados para el listado
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null)
  
  // Estados para crear/editar pedido
  const [showForm, setShowForm] = useState(false)
  const [editingPedido, setEditingPedido] = useState<any | null>(null)
  
  // Form data
  const [terceros, setTerceros] = useState<Array<{ id: number; nombre: string }>>([])
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string; stock: number }>>([])
  const [formData, setFormData] = useState({
    tercero_id: 0,
    fecha_entrega: '',
    notas: ''
  })
  const [items, setItems] = useState<Array<{ producto_id: number; cantidad: number }>>([])
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadPedido | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    (async () => {
      try {
        const [tercerosRes, productosRes] = await Promise.all([
          pedidoService.getTerceros(),
          productoService.getProductos(1, 200, { activo: true })
        ])
        
        setTerceros(tercerosRes.data)
        setProductos(productosRes.data.map((p: any) => ({ 
          id: p.id, 
          nombre: p.nombre, 
          stock: p.stock 
        })))
      } catch (error) {
        console.error('Error cargando datos:', error)
      }
    })()
  }, [])

  const resetForm = () => {
    setFormData({ tercero_id: 0, fecha_entrega: '', notas: '' })
    setItems([])
    setDisponibilidad(null)
    setError(null)
    setEditingPedido(null)
  }

  const handleShowForm = () => {
    resetForm()
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    resetForm()
  }

  const handleEdit = (pedido: any) => {
    setSelectedPedido(pedido)
    setFormData({
      tercero_id: pedido.tercero_id || 0,
      fecha_entrega: pedido.fecha_entrega || '',
      notas: pedido.notas || ''
    })
    setItems(pedido.items?.map((item: any) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad
    })) || [])
    setEditingPedido(pedido)
    setShowForm(true)
  }

  const refreshList = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Form handlers
  const addLinea = () => {
    setItems(prev => [...prev, { producto_id: 0, cantidad: 1 }])
  }

  const updateLinea = (i: number, patch: Partial<{ producto_id: number; cantidad: number }>) => {
    setItems(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }

  const removeLinea = (i: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const incrementCantidad = (i: number) => {
    setItems(prev => prev.map((l, idx) => idx === i ? { ...l, cantidad: l.cantidad + 1 } : l))
  }

  const decrementCantidad = (i: number) => {
    setItems(prev => prev.map((l, idx) => idx === i ? { ...l, cantidad: Math.max(1, l.cantidad - 1) } : l))
  }

  const puedeCalcular = useMemo(() => 
    items.length > 0 && items.every(l => l.producto_id && l.cantidad > 0), 
    [items]
  )

  const calcular = async () => {
    setError(null)
    setLoading(true)
    try {
      const input: NuevoPedidoInput = { 
        tercero_id: formData.tercero_id || null, 
        fecha_entrega: formData.fecha_entrega || null, 
        items,
        notas: formData.notas || null
      }
      const disp = await pedidoService.calcularDisponibilidad(input)
      setDisponibilidad(disp)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const crear = async () => {
    setError(null)
    setLoading(true)
    try {
      const input: NuevoPedidoInput = { 
        tercero_id: formData.tercero_id || null, 
        fecha_entrega: formData.fecha_entrega || null, 
        items,
        notas: formData.notas || null
      }
      const res = await pedidoService.crearPedidoConReserva(input)
      if (!res.ok) throw new Error(res.error || 'No se pudo crear')
      
      handleCloseForm()
      refreshList()
      // Show success toast instead of alert
      showSuccessToast('Pedido creado exitosamente y stock reservado')
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const showSuccessToast = (message: string) => {
    // In a real app, we would use a toast library
    alert(message)
  }

  const getProductoNombre = (productoId: number) => {
    const producto = productos.find(p => p.id === productoId)
    return producto?.nombre || `Producto #${productoId}`
  }

  // Modal component for editing pedido
  const EditarPedidoModal = ({ pedido, onClose }: { pedido: any, onClose: () => void }) => {
    const [lineas, setLineas] = useState<Array<{ producto_id: number; cantidad: number }>>(
      pedido?.items?.map((it: any) => ({ 
        producto_id: it.producto_id, 
        cantidad: Number(it.cantidad) 
      })) || []
    )
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const inc = (idx: number) => setLineas(prev => 
      prev.map((l, i) => i === idx ? { ...l, cantidad: l.cantidad + 1 } : l)
    )
    
    const dec = (idx: number) => setLineas(prev => 
      prev.map((l, i) => i === idx ? { ...l, cantidad: Math.max(0, l.cantidad - 1) } : l)
    )

    const guardar = async () => {
      setError(null)
      setLoading(true)
      try {
        const res = await pedidoService.ajustarPedido(pedido.id, lineas)
        if (!res.ok) throw new Error(res.error || 'No se pudo guardar')
        onClose()
        refreshList()
        showSuccessToast('Pedido actualizado exitosamente')
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    }

    const cancelar = async () => {
      if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido? Se liberarán todas las reservas.')) return
      
      setError(null)
      setLoading(true)
      try {
        const res = await pedidoService.cancelarPedido(pedido.id)
        if (!res.ok) throw new Error(res.error || 'No se pudo cancelar')
        onClose()
        refreshList()
        showSuccessToast('Pedido cancelado exitosamente')
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-800">Editar Pedido #{pedido?.id}</h3>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {pedido?.items?.map((it: any, idx: number) => (
              <div key={it.id} className="flex items-center justify-between border rounded-xl p-4 bg-gray-50">
                <div>
                  <div className="font-semibold text-gray-800">{it.productos?.nombre || `Producto ${it.producto_id}`}</div>
                  <div className="text-sm text-gray-500 mt-1">Solicitado originalmente: {it.cantidad}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => dec(idx)} 
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    disabled={loading}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input 
                    type="number" 
                    className="w-20 text-center border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={lineas[idx]?.cantidad || 0} 
                    onChange={e => setLineas(prev => 
                      prev.map((l, i) => i === idx ? { ...l, cantidad: Math.max(0, Number(e.target.value) || 0) } : l)
                    )} 
                    disabled={loading}
                  />
                  <button 
                    onClick={() => inc(idx)} 
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between gap-3 p-5 border-t bg-gray-50">
            <button 
              onClick={cancelar} 
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancelar pedido
            </button>
            <button 
              onClick={guardar} 
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  {editingPedido ? `Editar Pedido #${editingPedido.id}` : 'Nuevo Pedido'}
                </h1>
                <p className="mt-1 text-blue-100">Complete los datos del pedido y calcule la disponibilidad</p>
              </div>
              <button 
                onClick={handleCloseForm}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Datos del pedido */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Información del Pedido</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-1" />
                          Cliente (opcional)
                        </label>
                        <select 
                          value={formData.tercero_id} 
                          onChange={e => setFormData(prev => ({ ...prev, tercero_id: Number(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={0}>Sin cliente</option>
                          {terceros.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Fecha de entrega
                        </label>
                        <input 
                          type="date" 
                          value={formData.fecha_entrega} 
                          onChange={e => setFormData(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                        <input 
                          type="text" 
                          placeholder="Comentarios adicionales..."
                          value={formData.notas} 
                          onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items del pedido */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">
                        <Package className="w-5 h-5 inline mr-2" />
                        Productos del pedido
                      </h2>
                      <button 
                        onClick={addLinea}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar producto
                      </button>
                    </div>

                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-medium">No hay productos en el pedido</p>
                        <p className="text-sm">Agregue productos para continuar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((l, i) => {
                          const productoSeleccionado = productos.find(p => p.id === l.producto_id)
                          return (
                            <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
                              <div className="flex-1">
                                <select 
                                  value={l.producto_id} 
                                  onChange={e => updateLinea(i, { producto_id: Number(e.target.value) })}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value={0}>Seleccione producto...</option>
                                  {productos.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.nombre} (stock: {p.stock})
                                    </option>
                                  ))}
                                </select>
                                {productoSeleccionado && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Stock disponible: {productoSeleccionado.stock} unidades
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => decrementCantidad(i)}
                                  className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input 
                                  type="number" 
                                  min={1}
                                  value={l.cantidad} 
                                  onChange={e => updateLinea(i, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
                                  className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button 
                                  onClick={() => incrementCantidad(i)}
                                  className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => removeLinea(i)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Actions and Availability */}
                <div className="space-y-6">
                  {/* Acciones */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones</h2>
                    <div className="space-y-3">
                      <button 
                        onClick={calcular} 
                        disabled={!puedeCalcular || loading}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {loading ? 'Calculando...' : 'Calcular disponibilidad'}
                      </button>
                      
                      <button 
                        onClick={crear} 
                        disabled={!disponibilidad || loading || !disponibilidad.alcanza}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Creando...' : editingPedido ? 'Actualizar pedido' : 'Crear pedido y reservar'}
                      </button>
                    </div>

                    {error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Error:</span>
                        </div>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                      </div>
                    )}

                    {!disponibilidad?.alcanza && disponibilidad && (
                      <div className="mt-4 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">Hay productos sin disponibilidad suficiente</span>
                      </div>
                    )}
                  </div>

                  {/* Resumen */}
                  {disponibilidad && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Productos:</span>
                          <span className="font-medium">{items.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total unidades:</span>
                          <span className="font-medium">{items.reduce((sum, item) => sum + item.cantidad, 0)}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Disponibilidad:</span>
                            {disponibilidad.alcanza ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full text-xs">
                                <CheckCircle2 className="w-3 h-3"/>
                                Completa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full text-xs">
                                <XCircle className="w-3 h-3"/>
                                Parcial
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Disponibilidad */}
              {disponibilidad && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Análisis de Disponibilidad</h2>
                    <div className="flex items-center gap-2">
                      {disponibilidad.alcanza ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-sm">
                          <CheckCircle2 className="w-4 h-4"/>
                          Todo disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-sm">
                          <XCircle className="w-4 h-4"/>
                          Disponibilidad parcial
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {disponibilidad.lineas.map((linea: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {getProductoNombre(linea.producto_id)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Solicitado: {linea.solicitado} unidades | Stock actual: {linea.stock_producto}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {linea.alcanza ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-sm">
                                <CheckCircle2 className="w-3 h-3"/>
                                Disponible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded text-sm">
                                <XCircle className="w-3 h-3"/>
                                Faltante
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <div className="font-medium text-blue-900">Desde Stock</div>
                            <div className="text-blue-700">{linea.reservado_producto} unidades</div>
                          </div>
                          
                          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                            <div className="font-medium text-purple-900">Producible</div>
                            <div className="text-purple-700">{linea.producible_por_insumos} unidades</div>
                          </div>
                          
                          <div className={`p-3 rounded-lg border ${linea.alcanza ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className={`font-medium ${linea.alcanza ? 'text-green-900' : 'text-red-900'}`}>Total</div>
                            <div className={linea.alcanza ? 'text-green-700' : 'text-red-700'}>
                              {linea.reservado_producto + linea.producible_por_insumos} / {linea.solicitado}
                            </div>
                          </div>
                        </div>
                        
                        {linea.faltantes?.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="text-sm font-medium text-red-900 mb-2">Insumos faltantes:</h4>
                            <ul className="text-sm text-red-700 space-y-1">
                              {linea.faltantes.map((f: any) => (
                                <li key={f.insumo_id} className="flex items-center justify-between">
                                  <span>{f.nombre}</span>
                                  <span>Necesita: {f.requerido}, Disponible: {f.stock}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!disponibilidad.alcanza && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-900">¿Qué hacer con los faltantes?</h4>
                          <p className="text-amber-700 text-sm mt-1">
                            Puede crear el pedido de forma parcial (solo se reservará lo disponible) 
                            o adquirir los insumos faltantes antes de proceder.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-700" />
            </div>
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 mt-1">Administre pedidos de clientes con reserva automática de stock</p>
        </div>
        <button 
          onClick={handleShowForm}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nuevo pedido
        </button>
      </div>

      <ListadoPedidos 
        onEdit={handleEdit}
        onRefresh={refreshList}
        refreshTrigger={refreshTrigger}
      />

      {selectedPedido && (
        <EditarPedidoModal 
          pedido={selectedPedido}
          onClose={() => {
            setSelectedPedido(null)
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}

export default PedidosPage
