-- Vista para productos con bajo stock
-- Esta vista calcula si un producto necesita reposición comparando stock actual con stock mínimo

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

-- Comentario sobre cómo usar esta vista:
/*
Para obtener productos que necesitan reposición:

SELECT * FROM productos_con_alerta 
WHERE necesita_reposicion = true;

Esta vista es útil porque:
1. Evita tener que hacer cálculos en el cliente
2. Permite usar índices en la base de datos para mejor rendimiento
3. Simplifica las consultas desde el frontend
4. Centraliza la lógica de negocio en la base de datos
*/