# Implementación de Vista para Productos con Alerta de Stock

## Descripción

Este documento describe cómo implementar y usar la vista `productos_con_alerta` para mejorar el rendimiento de las consultas de productos con stock bajo.

## 1. Crear la Vista en Supabase

Ya se ha creado el archivo `vista_productos_alerta.sql` con la definición de la vista:

```sql
CREATE OR REPLACE VIEW productos_con_alerta AS
SELECT 
    id,
    nombre,
    descripcion,
    precio,
    costo,
    categoria_id,
    sku,
    codigo_barras,
    unidad_medida_id,
    stock,
    stock_minimo,
    foto_url,
    activo,
    creado_en,
    actualizado_en,
    (stock <= stock_minimo) AS necesita_reposicion
FROM productos
WHERE activo = true;
```

## 2. Implementación Futura en el Código

Cuando se decida implementar la vista, se deben hacer los siguientes cambios:

### 2.1. Actualizar el método `getProductos` en `ProductoService.ts`

Reemplazar las secciones comentadas con:

```ts
if (filter.stock_bajo) {
  // Usar la vista en lugar del filtro incorrecto
  query = query.from('productos_con_alerta').eq('necesita_reposicion', true);
}
```

Y en la sección de conteo:

```ts
if (filter.stock_bajo) {
  // Usar la vista en lugar del filtro incorrecto
  countQuery = countQuery.from('productos_con_alerta').eq('necesita_reposicion', true);
}
```

### 2.2. Actualizar el método `getProductoStats` en `ProductoService.ts`

Reemplazar la sección comentada con:

```ts
// Productos con stock bajo usando la vista
const { count: productosStockBajo } = await supabase
  .from('productos_con_alerta')
  .select('*', { count: 'exact', head: true })
  .eq('necesita_reposicion', true);
```

### 2.3. Actualizar el método `getProductosStockBajo` en `ProductoService.ts`

Reemplazar completamente el método con:

```ts
// Verificar productos con stock bajo usando la vista
async getProductosStockBajo(): Promise<{ data: Producto[] }> {
  try {
    const { data, error } = await supabase
      .from('productos_con_alerta')
      .select(`*,
        categorias!categoria_id (
          id,
          nombre,
          descripcion
        ),
        unidades_medida!unidad_medida_id (
          id,
          clave,
          nombre,
          simbolo
        )`)
      .eq('necesita_reposicion', true)
      .eq('activo', true)
      .order('stock', { ascending: true });

    if (error) throw error;

    return { data: data as Producto[] };
  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    return { data: [] };
  }
}
```

## 3. Beneficios de Usar la Vista

1. **Mejor rendimiento**: La comparación de stock se hace en la base de datos
2. **Menor carga en el cliente**: No es necesario filtrar en el frontend
3. **Consultas más simples**: El código se vuelve más limpio y mantenible
4. **Uso de índices**: La base de datos puede optimizar mejor las consultas

## 4. Instrucciones para Implementar

1. Ejecutar el script `vista_productos_alerta.sql` en la consola de Supabase
2. Descomentar y actualizar las secciones marcadas con TODO en `ProductoService.ts`
3. Probar las funcionalidades relacionadas con productos con stock bajo
4. Eliminar el código temporal de filtrado en el cliente

## 5. Consideraciones

- Asegurarse de que la vista esté actualizada si se cambia la estructura de la tabla `productos`
- La vista solo incluye productos activos, lo cual es el comportamiento esperado
- El campo `necesita_reposicion` es calculado automáticamente