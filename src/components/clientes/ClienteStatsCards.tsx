import React, { useEffect, useState } from 'react'
import { Users, CreditCard, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import { clienteService } from '../../services/ClienteService'
import type { ClienteStats } from '../../types/clientes'

export const ClienteStatsCards: React.FC = () => {
  const [stats, setStats] = useState<ClienteStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const { data } = await clienteService.getClienteStats()
      setStats(data)
      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: 'Total Clientes',
      value: stats.total_clientes.toString(),
      change: '+12.5%',
      positive: true,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Clientes Activos',
      value: stats.clientes_activos.toString(),
      change: `${((stats.clientes_activos / stats.total_clientes) * 100).toFixed(1)}%`,
      positive: true,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Con Deuda',
      value: stats.clientes_con_deuda.toString(),
      change: `Bs. ${stats.deuda_total.toLocaleString()}`,
      positive: false,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Límite Crédito',
      value: `Bs. ${stats.limite_credito_total.toLocaleString()}`,
      change: 'Total disponible',
      positive: true,
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${card.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change !== 'Total disponible' && (
                      <TrendingUp className={`w-4 h-4 mr-1 ${!card.positive ? 'rotate-180' : ''}`} />
                    )}
                    {card.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {stats.cliente_top && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cliente Destacado</h3>
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{stats.cliente_top.nombre}</p>
              <p className="text-sm text-gray-600">Mayor volumen de compras</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">Bs. {stats.cliente_top.total_compras.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total compras</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
