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
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-amber-700" /> Recetas
          </h1>
          <p className="text-gray-600 mt-1">Define y produce productos en base a sus insumos</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Selector y estadísticas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-amber-700" />
            <span className="text-sm font-medium text-gray-900">Producto</span>
          </div>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
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

        <div className="bg-white rounded-2xl border p-5 shadow-sm grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200">
            <div className="text-xs text-amber-800">Insumos</div>
            <div className="text-2xl font-bold text-amber-900">{totalInsumos}</div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200">
            <div className="text-xs text-emerald-800">Obligatorios</div>
            <div className="text-2xl font-bold text-emerald-900">{obligatorios}</div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
            <div className="text-xs text-blue-800">Opcionales</div>
            <div className="text-2xl font-bold text-blue-900">{opcionales}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="w-5 h-5 text-amber-700" />
              <span className="text-sm font-medium text-gray-900">Producibles con stock actual</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-800">{producibles}</div>
            <p className="text-xs text-gray-500 mt-1">Basado en insumos obligatorios</p>
          </div>
          {productoId && (
            <button onClick={handleProduce} disabled={producing} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">{producing ? 'Produciendo...' : 'Producir'}</button>
          )}
        </div>
      </div>

      {/* Editor de receta */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        {!productoId ? (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Info className="w-4 h-4" /> Selecciona un producto para editar su receta
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Agregar Insumo</h3>
              <AgregarInsumoForm onAdd={handleAdd} />
            </div>
            <RecetaEditor
              items={items}
              onChangeCantidad={handleChangeCantidad}
              onToggleObligatorio={handleToggleObligatorio}
              onRemove={handleRemove}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default RecetasPage
