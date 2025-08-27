import React, { useState, useEffect } from 'react'
import { Users, UserCheck, UserPlus, ShoppingCart, Clock } from 'lucide-react'
import { proveedorService } from '../../services/ProveedorService'
import type { ProveedorStats } from '../../types/proveedores'

export const ProveedorStatsCards: React.FC = () => {
  const [stats, setStats] = useState<ProveedorStats>({
    totalProveedores: 0,
    proveedoresActivos: 0,
    nuevosEsteMes: 0,
    totalCompras: 0,
    promedioEntrega: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data } = await proveedorService.getProveedorStats()
      setStats(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Total Proveedores',
      value: stats.totalProveedores,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Proveedores Activos',
      value: stats.proveedoresActivos,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Nuevos Este Mes',
      value: stats.nuevosEsteMes,
      icon: UserPlus,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Compras',
      value: stats.totalCompras,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Promedio Entrega',
      value: `${stats.promedioEntrega} días`,
      icon: Clock,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <IconComponent className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}