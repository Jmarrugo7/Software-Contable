-- Convertir automáticamente los montos a negativo para las Notas Crédito

create or replace function public.trg_facturas_validar()
returns trigger language plpgsql as $$
declare
  v_permite_negativo boolean;
  v_requiere_comp    boolean;
begin
  -- Limpieza de textos
  new.proveedor           := btrim(new.proveedor);
  new.observaciones       := btrim(new.observaciones);
  new.numero_factura      := nullif(btrim(coalesce(new.numero_factura, '')), '');
  new.numero_comprobante  := nullif(btrim(coalesce(new.numero_comprobante, '')), '');

  if tg_op = 'INSERT' then
    -- Permitimos que el frontend envíe su propia fecha. 
    -- Si no envía nada, usamos now()
    new.fecha_registro := coalesce(new.fecha_registro, now());
    new.estado         := 'activa';
    new.created_at     := now();
  else
    -- Permitir cambiar la fecha_registro en la edición
    -- new.fecha_registro se mantiene como venga en el update
    new.created_at     := old.created_at;
    new.updated_at     := now();

    -- Una anulada no se edita: primero se reactiva (RN-11)
    if old.estado = 'anulada' and new.estado = 'anulada' then
      raise exception 'Una factura anulada no se puede editar. Reactívela primero.';
    end if;

    -- El estado solo cambia mediante anular_factura() / reactivar_factura()
    if old.estado <> new.estado
       and coalesce(current_setting('app.cambio_estado', true), '') <> 'on' then
      raise exception 'Use anular_factura() o reactivar_factura() para cambiar el estado.';
    end if;
  end if;

  -- Montos: solo NOTA CREDITO admite negativos (devoluciones)
  select permite_negativo into v_permite_negativo
    from public.gastos_compras where id = new.gasto_compra_id;

  if v_permite_negativo then
    if new.precio_unitario = 0 then
      raise exception 'El precio unitario no puede ser cero.';
    end if;
    
    -- Convertir automáticamente a negativo si se ingresaron positivos
    if new.precio_unitario > 0 then new.precio_unitario := -new.precio_unitario; end if;
    if new.iva > 0 then new.iva := -new.iva; end if;
    if new.retefuente > 0 then new.retefuente := -new.retefuente; end if;
    if new.reteica > 0 then new.reteica := -new.reteica; end if;
    if new.reteiva > 0 then new.reteiva := -new.reteiva; end if;
  else
    if new.precio_unitario <= 0 then
      raise exception 'El precio unitario debe ser mayor que cero. Los valores negativos solo aplican a NOTA CREDITO.';
    end if;
    if new.iva < 0 or new.retefuente < 0 or new.reteica < 0 or new.reteiva < 0 then
      raise exception 'IVA y retenciones no pueden ser negativos.';
    end if;
    if round(new.cantidad * new.precio_unitario, 2)
       + new.iva - new.retefuente - new.reteica - new.reteiva < 0 then
      raise exception 'Las retenciones no pueden dejar el total de la factura en negativo.';
    end if;
  end if;

  -- RF-19 / RN-09: transferencia exige número de comprobante
  select requiere_comprobante into v_requiere_comp
    from public.metodos_pago where id = new.metodo_pago_id;

  if v_requiere_comp and new.numero_comprobante is null then
    raise exception 'El número de comprobante es obligatorio para pagos por transferencia.';
  end if;

  return new;
end $$;
