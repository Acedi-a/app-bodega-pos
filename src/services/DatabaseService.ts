import { supabase } from '../lib/supabase'

export class DatabaseService {
  async initializeBasicData() {
    try {
      console.log('Verificando datos básicos...')

      // Verificar y crear roles si no existen
      const { data: existingRoles } = await supabase
        .from('roles')
        .select('clave')

      if (!existingRoles || existingRoles.length === 0) {
        console.log('Creando roles básicos...')
        await supabase.from('roles').insert([
          { clave: 'administrador', nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
          { clave: 'empleado', nombre: 'Empleado', descripcion: 'Acceso limitado para empleados' },
          { clave: 'distribuidor', nombre: 'Distribuidor', descripcion: 'Acceso para distribuidores' }
        ])
      }

      // Verificar y crear tipos de tercero si no existen
      const { data: existingTipos } = await supabase
        .from('tipos_tercero')
        .select('clave')

      if (!existingTipos || existingTipos.length === 0) {
        console.log('Creando tipos de tercero...')
        await supabase.from('tipos_tercero').insert([
          { clave: 'cliente', nombre: 'Cliente' },
          { clave: 'proveedor', nombre: 'Proveedor' },
          { clave: 'distribuidor', nombre: 'Distribuidor' }
        ])
      }

      // Verificar y crear estados si no existen
      const { data: existingEstados } = await supabase
        .from('estados')
        .select('categoria, clave')

      if (!existingEstados || existingEstados.length === 0) {
        console.log('Creando estados básicos...')
        await supabase.from('estados').insert([
          { categoria: 'venta', clave: 'pendiente', nombre: 'Pendiente' },
          { categoria: 'venta', clave: 'completada', nombre: 'Completada' },
          { categoria: 'venta', clave: 'cancelada', nombre: 'Cancelada' },
          { categoria: 'pedido', clave: 'pendiente', nombre: 'Pendiente' },
          { categoria: 'pedido', clave: 'confirmado', nombre: 'Confirmado' },
          { categoria: 'pedido', clave: 'entregado', nombre: 'Entregado' },
          { categoria: 'cuenta', clave: 'pendiente', nombre: 'Pendiente' },
          { categoria: 'cuenta', clave: 'pagado', nombre: 'Pagado' }
        ])
      }

      console.log('Datos básicos verificados correctamente')
      return true
    } catch (error) {
      console.error('Error inicializando datos básicos:', error)
      return false
    }
  }
}

export const dbService = new DatabaseService()
