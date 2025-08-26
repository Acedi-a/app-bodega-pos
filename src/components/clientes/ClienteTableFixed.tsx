import React, { useState, useMemo } from 'react'
import { Edit, Trash2, Eye, User, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Cliente } from '../../types/clientes'

interface ClienteTableProps {
  clientes: Cliente[]
  onEdit: (cliente: Cliente) => void
  onDelete: (id: number) => Promise<void>
  onViewDetails: (cliente: Cliente) => void
}

export const ClienteTable: React.FC<ClienteTableProps> = ({ 
  clientes, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Paginación
  const totalPages = Math.ceil(clientes.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentClientes = useMemo(() => 
    clientes.slice(startIndex, endIndex), 
    [clientes, startIndex, endIndex]
  )

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleDelete = async (cliente: Cliente) => {
    try {
      await onDelete(cliente.id)
    } catch (error) {
      console.error('Error eliminando cliente:', error)
    }
  }

  if (clientes.length === 0) {
    return (
      <div className="p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
        <p className="text-gray-600">Comienza agregando tu primer cliente.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deuda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentClientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cliente.nit && `NIT: ${cliente.nit}`}
                        {cliente.ci && `CI: ${cliente.ci}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {cliente.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {cliente.email}
                      </div>
                    )}
                    {cliente.telefono && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-48">{cliente.direccion}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="font-medium text-red-600">
                      Bs. {cliente.cliente_info?.deuda_actual?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Límite: Bs. {cliente.cliente_info?.limite_credito?.toLocaleString() || '0'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cliente.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(cliente)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(cliente)}
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(endIndex, clientes.length)} de {clientes.length} clientes
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else {
                  const start = Math.max(1, currentPage - 2)
                  const end = Math.min(totalPages, start + 4)
                  pageNum = start + i
                  if (pageNum > end) return null
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
