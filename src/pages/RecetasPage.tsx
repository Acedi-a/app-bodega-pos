import React, { useEffect, useMemo, useState } from 'react'
import { recetaService } from '../services/RecetaService'
import { productoService } from '../services/ProductoService'
import { productionService } from '../services/ProductionService'
import type { Producto } from '../types/productos'
import type { ProductoReceta } from '../types/productos'
import { RecetaEditor } from '../components/recetas/RecetaEditor'
import { AgregarInsumoForm } from '../components/recetas/AgregarInsumoForm'
import { RefreshCw, FlaskConical, Package, Info, Calculator } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const RecetasPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState<number | ''>('')
  const [items, setItems] = useState<ProductoReceta[]>([])
  const [producibles, setProducibles] = useState<number>(0)
  const productoActual = useMemo(() => productos.find(p => p.id === productoId), [productos, productoId])

  // Leer productoId desde query param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qp = params.get('productoId')
    if (qp) setProductoId(Number(qp))
  }, [location.search])

  useEffect(() => {
    const load = async () => {
      const { data } = await productoService.getProductos(1, 500, { activo: true })
      setProductos(data)
    }
    load()
  }, [])

  // Cargar datos de receta cuando cambia el producto
  useEffect(() => {
    if (!productoId) return
    const load = async () => {
      const { data } = await recetaService.getRecetaByProducto(Number(productoId))
      setItems(data)
      const { unidades } = await recetaService.getUnidadesProducibles(Number(productoId))
      setProducibles(unidades)
    }
    load()
  }, [productoId])

  // Sincronizar query param con el estado
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (productoId) {
      params.set('productoId', String(productoId))
    } else {
      params.delete('productoId')
    }
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
  }, [productoId])

  const refresh = async () => {
    if (!productoId) return
    const { data } = await recetaService.getRecetaByProducto(Number(productoId))
    setItems(data)
    const { unidades } = await recetaService.getUnidadesProducibles(Number(productoId))
    setProducibles(unidades)
  }

  const handleAdd = async (insumo: any, cantidad: number, obligatorio: boolean) => {
    if (!productoId) return
    await recetaService.addInsumoToReceta({ producto_id: Number(productoId), insumo_id: insumo.id, cantidad_por_unidad: cantidad, obligatorio })
    await refresh()
  }

  const handleChangeCantidad = async (id: number, cantidad: number) => {
    await recetaService.updateRecetaItem(id, { cantidad_por_unidad: cantidad })
    await refresh()
  }

  const handleToggleObligatorio = async (id: number, obligatorio: boolean) => {
    await recetaService.updateRecetaItem(id, { obligatorio })
    await refresh()
  }

  const handleRemove = async (id: number) => {
    await recetaService.removeRecetaItem(id)
    await refresh()
  }

  const [producing, setProducing] = useState(false)

  const handleProduce = async () => {
    if (!productoId) return
    const val = window.prompt('¿Cuántas unidades deseas producir?', '1')
    if (val === null) return
    const n = Number(val)
    if (!Number.isFinite(n) || n <= 0) return
    setProducing(true)
    const res = await productionService.producirProducto(Number(productoId), n, null, 'Producción manual')
    setProducing(false)
    if (!res.ok) {
      const msg = res.error || 'No se pudo producir'
      const falt = res.faltantes?.map(f => `- ${f.nombre || f.insumo_id}: req ${f.requerido}, stock ${f.stock}`).join('\n')
      window.alert(`${msg}${falt ? '\n\nFaltantes:\n' + falt : ''}`)
      return
    }
    await refresh()
  }

  // KPIs básicos
  const totalInsumos = items.length
  const obligatorios = items.filter(i => i.obligatorio).length
  const opcionales = totalInsumos - obligatorios

  return (
    <div className="pb-6">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FlaskConical className="w-7 h-7 text-amber-700" />
              </div>
              Recetas
            </h1>
            <p className="text-gray-600 mt-2 ml-12">Define y produce productos en base a sus insumos</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={refresh} 
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Selector y KPIs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Selector de producto */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Producto</h2>
            </div>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            >
              <option value="">Selecciona un producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            {productoActual && (
              <div className="mt-3 text-sm text-gray-600">
                Stock: <span className="font-semibold text-gray-900">{productoActual.stock}</span>
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Insumos</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center">
                <div className="text-2xl font-bold text-amber-900">{totalInsumos}</div>
                <div className="text-xs text-amber-800 mt-1">Total</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-center">
                <div className="text-2xl font-bold text-emerald-900">{obligatorios}</div>
                <div className="text-xs text-emerald-800 mt-1">Obligatorios</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-900">{opcionales}</div>
                <div className="text-xs text-blue-800 mt-1">Opcionales</div>
              </div>
            </div>
          </div>

          {/* Producción */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Producción</h2>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Unidades producibles</div>
              <div className="text-3xl font-extrabold text-amber-700">{producibles}</div>
              <p className="text-xs text-gray-500 mt-1">Basado en insumos obligatorios</p>
            </div>
            {productoId && (
              <button 
                onClick={handleProduce} 
                disabled={producing} 
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                {producing ? 'Produciendo...' : 'Producir Producto'}
              </button>
            )}
          </div>
        </div>

        {/* Columna derecha - Editor de receta */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Receta del Producto</h2>
              <div className="text-sm text-gray-500">
                {items.length} insumo{items.length !== 1 ? 's' : ''}
              </div>
            </div>

            {!productoId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Info className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-1">No hay producto seleccionado</p>
                <p className="text-gray-500 text-sm">Selecciona un producto para editar su receta</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Formulario para agregar insumos */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Agregar Insumo</h3>
                  <AgregarInsumoForm onAdd={handleAdd} />
                </div>

                {/* Editor de receta */}
                <div>
                  <RecetaEditor
                    items={items}
                    onChangeCantidad={handleChangeCantidad}
                    onToggleObligatorio={handleToggleObligatorio}
                    onRemove={handleRemove}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecetasPage
