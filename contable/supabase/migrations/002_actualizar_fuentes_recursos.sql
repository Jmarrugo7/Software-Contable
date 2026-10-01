-- Migración 002: Actualizar fuentes de recursos
-- Nuevas fuentes: SRA FIDIA, SRA MARITZA, JAIR, GRUPO SINERGIA, EFECTIVO, CAJA MENOR

-- Paso 1: Eliminar las que ya no se usan (DISMEJ SAS)
-- Si hay facturas que referencian DISMEJ SAS, primero reasignarlas o manejar manualmente.
-- Por seguridad, intentamos borrar; si falla por FK, se debe reasignar manualmente.
delete from public.fuentes_recursos
  where upper(btrim(nombre)) = 'DISMEJ SAS';

-- Paso 2: Insertar las nuevas fuentes que no existan aún
-- (CAJA MENOR y SRA FIDIA ya existen, se omiten con ON CONFLICT)
insert into public.fuentes_recursos (nombre, es_predefinida) values
  ('SRA FIDIA', true),
  ('SRA MARITZA', true),
  ('JAIR', true),
  ('GRUPO SINERGIA', true),
  ('EFECTIVO', true),
  ('CAJA MENOR', true)
on conflict ((upper(btrim(nombre)))) do nothing;
