import React, { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { 
  Wine, 
  Users, 
  Truck, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Factory,
  CreditCard,
  AlertTriangle,
  NotepadText,
  BottleWine
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Truck, label: 'Proveedores', path: '/proveedores' },
  { icon: Package, label: 'Productos', path: '/productos' },
  { icon: Package, label: 'Insumos', path: '/insumos' },
  { icon: NotepadText, label: 'Recetas', path: '/recetas' },
  { icon: Factory, label: 'Inventario', path: '/inventario' },
  { icon: BottleWine, label: 'Inventario Insumos', path: '/inventario-insumos' },
  { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
  { icon: CreditCard, label: 'Pedidos', path: '/pedidos' },
  { icon: AlertTriangle, label: 'Pérdidas', path: '/perdidas' },
  { icon: BarChart3, label: 'Reportes', path: '/reportes' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
]

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, role, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
  }

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-sm shadow-xl border-r border-amber-100 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Header del sidebar */}
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-amber-600 to-red-700">
          <div className="flex items-center space-x-2">
            <Wine className="w-8 h-8 text-white" />
            <span className="text-xl font-bold text-white">Bodega</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-amber-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Usuario info */}
        <div className="p-6 border-b border-amber-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.nombre?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {role?.nombre || 'Usuario'}
              </p>
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="mt-6 flex-1">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-amber-100 to-red-100 text-amber-900 border-l-4 border-amber-600'
                      : 'text-gray-600 hover:bg-amber-50 hover:text-amber-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-amber-700' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-amber-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:ml-64">
        {/* Header móvil */}
        <div className="lg:hidden bg-white/95 backdrop-blur-sm shadow-sm border-b border-amber-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-amber-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Wine className="w-6 h-6 text-amber-700" />
              <span className="text-lg font-bold text-gray-900">Bodega</span>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
