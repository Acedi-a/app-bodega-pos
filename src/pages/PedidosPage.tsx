import React, { useEffect, useMemo, useState } from 'react'
import { pedidoService } from '../services/PedidoService'
import { productoService } from '../services/ProductoService'
import type { NuevoPedidoInput, DisponibilidadPedido } from '../types/pedidos'
import { Calendar, CheckCircle2, Package, XCircle, Plus, Minus, Save, User, ShoppingBag, RotateCcw, AlertTriangle, Info } from 'lucide-react'
import { ListadoPedidos } from '../components/pedidos/ListadoPedidos'
import { EditarPedidoModal } from '../components/pedidos/EditarPedidoModal'

const PedidosPage: React.FC = () => {
  // Estados para el listado
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
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
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedPedido(null)
    setRefreshTrigger(prev => prev + 1)
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
      alert('Pedido creado exitosamente y stock reservado')
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const getProductoNombre = (productoId: number) => {
    const producto = productos.find(p => p.id === productoId)
    return producto?.nombre || `Producto #${productoId}`
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-blue-700" />
                </div>
                {editingPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
              </h1>
              <p className="text-gray-600 mt-1">Complete los datos del pedido y calcule la disponibilidad</p>
            </div>
            <button 
              onClick={handleCloseForm}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Volver al listado
            </button>
          </div>

          {/* Datos del pedido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input 
                type="text" 
                placeholder="Comentarios adicionales..."
                value={formData.notas} 
                onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Items del pedido */}
          <div className="border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                <Package className="w-5 h-5 inline mr-2" />
                Productos del pedido
              </h3>
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
                <p>No hay productos en el pedido</p>
                <p className="text-sm">Agregue productos para continuar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((l, i) => {
                  const productoSeleccionado = productos.find(p => p.id === l.producto_id)
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <select 
                          value={l.producto_id} 
                          onChange={e => updateLinea(i, { producto_id: Number(e.target.value) })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
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
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input 
                          type="number" 
                          min={1}
                          value={l.cantidad} 
                          onChange={e => updateLinea(i, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                        />
                        <button 
                          onClick={() => incrementCantidad(i)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeLinea(i)}
                        className="px-3 py-1 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button 
                onClick={calcular} 
                disabled={!puedeCalcular || loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? 'Calculando...' : 'Calcular disponibilidad'}
              </button>
              
              <button 
                onClick={crear} 
                disabled={!disponibilidad || loading || !disponibilidad.alcanza}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Creando...' : 'Crear pedido y reservar'}
              </button>
            </div>

            {!disponibilidad?.alcanza && disponibilidad && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Hay productos sin disponibilidad suficiente</span>
              </div>
            )}
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
        </div>

        {/* Disponibilidad */}
        {disponibilidad && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Análisis de Disponibilidad</h2>
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
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                      <div className="font-medium text-blue-900">Desde Stock</div>
                      <div className="text-blue-700">{linea.reservado_producto} unidades</div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                      <div className="font-medium text-purple-900">Producible</div>
                      <div className="text-purple-700">{linea.producible_por_insumos} unidades</div>
                    </div>
                    
                    <div className={`p-3 rounded border ${linea.alcanza ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className={`font-medium ${linea.alcanza ? 'text-green-900' : 'text-red-900'}`}>Total</div>
                      <div className={linea.alcanza ? 'text-green-700' : 'text-red-700'}>
                        {linea.reservado_producto + linea.producible_por_insumos} / {linea.solicitado}
                      </div>
                    </div>
                  </div>
                  
                  {linea.faltantes?.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {showEditModal && selectedPedido && (
        <EditarPedidoModal 
          open={showEditModal}
          onClose={handleCloseEditModal}
          pedidoId={selectedPedido.id}
        />
      )}
    </div>
  )
}

export default PedidosPage
