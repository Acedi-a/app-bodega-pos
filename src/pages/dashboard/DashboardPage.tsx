import React from 'react'
import { 
  Wine, 
  Users, 
  Package, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  ShoppingCart,
  Truck
} from 'lucide-react'

const stats = [
  {
    title: 'Ventas del Mes',
    value: 'Bs. 125,430',
    change: '+12.5%',
    positive: true,
    icon: DollarSign,
    color: 'from-green-500 to-green-600'
  },
  {
    title: 'Productos Vendidos',
    value: '847',
    change: '+8.3%',
    positive: true,
    icon: ShoppingCart,
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Clientes Activos',
    value: '156',
    change: '+15.2%',
    positive: true,
    icon: Users,
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Stock Bajo',
    value: '23',
    change: '-5.1%',
    positive: false,
    icon: AlertCircle,
    color: 'from-red-500 to-red-600'
  }
]

const recentSales = [
  { id: 1, cliente: 'Restaurant El Parador', producto: 'Malbec Reserva 2020', cantidad: 12, total: 'Bs. 2,400' },
  { id: 2, cliente: 'Hotel Casa Grande', producto: 'Cabernet Sauvignon', cantidad: 6, total: 'Bs. 1,200' },
  { id: 3, cliente: 'Bar & Grill', producto: 'Merlot Premium', cantidad: 18, total: 'Bs. 3,600' },
  { id: 4, cliente: 'Restaurante Italiano', producto: 'Chardonnay', cantidad: 8, total: 'Bs. 1,600' },
]

const lowStockProducts = [
  { nombre: 'Malbec Reserva 2019', stock: 5, minimo: 20, categoria: 'Tintos' },
  { nombre: 'Sauvignon Blanc', stock: 8, minimo: 15, categoria: 'Blancos' },
  { nombre: 'Cabernet Premium', stock: 3, minimo: 25, categoria: 'Tintos' },
  { nombre: 'Rosé Especial', stock: 12, minimo: 30, categoria: 'Rosados' },
]

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen general de la bodega</p>
        </div>
        <div className="flex items-center space-x-2 text-amber-700">
          <Wine className="w-6 h-6" />
          <span className="text-sm font-medium">Bodega Premium</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${stat.positive ? '' : 'rotate-180'}`} />
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Ventas Recientes</h2>
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{sale.cliente}</p>
                  <p className="text-sm text-gray-600">{sale.producto} x{sale.cantidad}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{sale.total}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="w-full text-center py-2 text-amber-700 hover:text-amber-800 font-medium text-sm transition-colors">
              Ver todas las ventas
            </button>
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Productos con Stock Bajo</h2>
            <Package className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{product.nombre}</p>
                  <p className="text-sm text-gray-600">{product.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{product.stock} unidades</p>
                  <p className="text-xs text-gray-500">Mín: {product.minimo}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="w-full text-center py-2 text-red-700 hover:text-red-800 font-medium text-sm transition-colors">
              Ver inventario completo
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 group">
            <ShoppingCart className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Nueva Venta</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
            <Package className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Añadir Producto</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group">
            <Users className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Nuevo Cliente</span>
          </button>
          <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group">
            <Truck className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Orden Compra</span>
          </button>
        </div>
      </div>
    </div>
  )
}
