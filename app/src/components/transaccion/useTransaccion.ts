// ============================================================================
// USE TRANSACCION
// Hook central de estado para vistas transaccionales de presupuesto.
// Gestiona encabezado, grupos de detalle, subtotales directos y totales.
// ============================================================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { buildApiErrorMessage, isApiValidationError } from '@/lib/apiError';
import type {
  EncabezadoForm,
  VehiculoForm,
  ClienteForm,
  ContribuyenteForm,
  GrupoDetalle,
  DetalleLinea,
  TipoPresupuestoConfig,
  TotalesCalc,
  SubtotalItem,
} from './types';
import {
  createEmptyEncabezado,
  buildGruposFromConfig,
  calcularTotales,
  determineCaso,
} from './types';

// ============================================================================
// INTERFACE PÚBLICA DEL HOOK
// ============================================================================

export interface UseTransaccionReturn {
  encabezado: EncabezadoForm;
  grupos: GrupoDetalle[];
  subtotalesDirectos: Record<string, number>;
  totales: TotalesCalc;
  loading: boolean;
  saving: boolean;
  hasExento: boolean;

  setEncabezadoField: <K extends keyof EncabezadoForm>(key: K, value: EncabezadoForm[K]) => void;
  setVehiculoField: <K extends keyof VehiculoForm>(key: K, value: VehiculoForm[K]) => void;
  setClienteField: <K extends keyof ClienteForm>(key: K, value: ClienteForm[K]) => void;
  setContribuyenteField: <K extends keyof ContribuyenteForm>(key: K, value: ContribuyenteForm[K]) => void;

  setGrupoLineas: (grupoId: number, lineas: DetalleLinea[]) => void;
  setSubtotalDirecto: (codigo_subtotal: string, valor: number) => void;

  lookupPatente: (patente: string) => Promise<void>;
  lookupRut: (rut: string, target: 'cliente' | 'contribuyente') => Promise<void>;

  onTipoPresupuestoChange: (idTipo: number | null, idEmpresa?: number | null) => Promise<void>;
  save: () => Promise<{ success: boolean; id?: number }>;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTransaccion(presupuestoId?: number): UseTransaccionReturn {
  const [encabezado, setEncabezadoState] = useState<EncabezadoForm>(createEmptyEncabezado());
  const [grupos, setGrupos] = useState<GrupoDetalle[]>([]);
  const [subtotalesDirectos, setSubtotalesDirectos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- Cargar presupuesto existente ----

  useEffect(() => {
    if (!presupuestoId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // 1. Fetch payload completo
        const payloadRes = await fetch(`/api/presupuestos/${presupuestoId}`);
        const payloadData = await payloadRes.json();
        if (!payloadData.success) throw new Error(payloadData.message ?? 'Error al cargar presupuesto');
        const { encabezado: enc, detalles, subtotales } = payloadData.data;

        // 2. Fetch config de tipo para reconstruir grupos (pasa id_empresa para obtener porcentaje_iva)
        const cfgParams = enc.id_empresa ? `?id_empresa=${enc.id_empresa}` : '';
        const cfgRes = await fetch(`/api/tipos-presupuesto/${enc.id_tipo_presupuesto}/config${cfgParams}`);
        const cfgData = await cfgRes.json();
        if (!cfgData.success) throw new Error('No se pudo cargar la configuración del tipo');
        const config: TipoPresupuestoConfig = cfgData.data;

        if (cancelled) return;

        // 3. Reconstruir grupos con líneas existentes
        const gruposBuilt = buildGruposFromConfig(config.detalles, detalles);
        setGrupos(gruposBuilt);

        // 4. Restaurar subtotales directos (solo para grupos Caso 1)
        const directos: Record<string, number> = {};
        config.detalles.forEach((det) => {
          if (determineCaso(det) === 1) {
            const st = (subtotales as SubtotalItem[]).find(
              (s) => s.codigo_subtotal === det.codigo_subtotal
            );
            if (st) directos[det.codigo_subtotal] = st.subtotal;
          }
        });
        setSubtotalesDirectos(directos);
        setEncabezadoState(enc);
      } catch (e: any) {
        if (!cancelled) {
          notifications.show({
            title: 'Error',
            message: e.message ?? 'No se pudo cargar el presupuesto',
            color: 'red',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [presupuestoId]);

  // ---- Derivados ----

  const hasExento = useMemo(
    () => grupos.some((g) => g.ver_sw_exento && g.lineas.some((l) => l.sw_exento)),
    [grupos]
  );

  const totales = useMemo(
    () => calcularTotales(grupos, subtotalesDirectos, encabezado.porcentaje_iva),
    [grupos, subtotalesDirectos, encabezado.porcentaje_iva]
  );

  // ---- Setters de encabezado ----

  const setEncabezadoField = useCallback(
    <K extends keyof EncabezadoForm>(key: K, value: EncabezadoForm[K]) => {
      setEncabezadoState((prev) => {
        const next = { ...prev, [key]: value };

        // sw_facturar → off: limpia contribuyente
        if (key === 'sw_facturar' && !value) {
          next.contribuyente = null;
          next.sw_mismo_cliente = false;
        }
        // sw_facturar → on: inicializa contribuyente
        if (key === 'sw_facturar' && value) {
          next.contribuyente = next.sw_mismo_cliente
            ? { ...next.cliente }
            : { rut: '', nombre: '', giro: '', id_region: null, id_comuna: null, direccion: '', email: '', telefono: '' };
        }
        // sw_mismo_cliente → on: copia cliente a contribuyente
        if (key === 'sw_mismo_cliente' && value && prev.sw_facturar) {
          next.contribuyente = { ...next.cliente };
        }

        return next;
      });
    },
    []
  );

  const setVehiculoField = useCallback(
    <K extends keyof VehiculoForm>(key: K, value: VehiculoForm[K]) => {
      setEncabezadoState((prev) => ({ ...prev, vehiculo: { ...prev.vehiculo, [key]: value } }));
    },
    []
  );

  const setClienteField = useCallback(
    <K extends keyof ClienteForm>(key: K, value: ClienteForm[K]) => {
      setEncabezadoState((prev) => {
        const next = { ...prev, cliente: { ...prev.cliente, [key]: value } };
        // Mantiene contribuyente sincronizado si sw_mismo_cliente
        if (prev.sw_mismo_cliente && prev.sw_facturar && prev.contribuyente) {
          next.contribuyente = { ...next.cliente };
        }
        return next;
      });
    },
    []
  );

  const setContribuyenteField = useCallback(
    <K extends keyof ContribuyenteForm>(key: K, value: ContribuyenteForm[K]) => {
      setEncabezadoState((prev) => ({
        ...prev,
        contribuyente: prev.contribuyente ? { ...prev.contribuyente, [key]: value } : null,
      }));
    },
    []
  );

  // ---- Setters de detalle ----

  const setGrupoLineas = useCallback((grupoId: number, lineas: DetalleLinea[]) => {
    setGrupos((prev) => prev.map((g) => (g.id === grupoId ? { ...g, lineas } : g)));
  }, []);

  const setSubtotalDirecto = useCallback((codigo_subtotal: string, valor: number) => {
    setSubtotalesDirectos((prev) => ({ ...prev, [codigo_subtotal]: valor }));
  }, []);

  // ---- Cambio de tipo presupuesto ----

  const onTipoPresupuestoChange = useCallback(async (idTipo: number | null, idEmpresa?: number | null) => {
    setEncabezadoState((prev) => ({ ...prev, id_tipo_presupuesto: idTipo }));
    if (!idTipo) {
      setGrupos([]);
      setSubtotalesDirectos({});
      return;
    }
    try {
      const params = idEmpresa ? `?id_empresa=${idEmpresa}` : '';
      const res = await fetch(`/api/tipos-presupuesto/${idTipo}/config${params}`);
      const data: { success: boolean; data: TipoPresupuestoConfig } = await res.json();
      if (!data.success) throw new Error('No se pudo cargar la configuración');
      const config = data.data;
      setEncabezadoState((prev) => ({ ...prev, porcentaje_iva: config.porcentaje_iva }));
      setGrupos(buildGruposFromConfig(config.detalles));
      setSubtotalesDirectos({});
    } catch (e: any) {
      notifications.show({
        title: 'Error',
        message: e.message ?? 'Error al cargar tipo de presupuesto',
        color: 'red',
      });
    }
  }, []);

  // ---- Lookups ----

  const lookupPatente = useCallback(async (patente: string) => {
    if (!patente.trim()) return;
    try {
      const res = await fetch(`/api/presupuestos/lookup/patente?q=${encodeURIComponent(patente.trim().toUpperCase())}`);
      const data = await res.json();
      if (!data.success || !data.data) return;
      const v = data.data;
      setEncabezadoState((prev) => ({
        ...prev,
        vehiculo: {
          patente:   prev.vehiculo.patente,  // preserva patente ingresada
          id_marca:  v.id_marca  ?? null,
          id_modelo: v.id_modelo ?? null,
          anio:      v.anio      ?? null,
          color:     v.color     ?? '',
        },
        // Pre-poblar cliente desde último cliente asociado al vehículo
        cliente: v.ultimo_cliente
          ? {
              rut:       v.ultimo_cliente.rut      ?? '',
              nombre:    v.ultimo_cliente.nombre   ?? '',
              giro:      v.ultimo_cliente.giro     ?? '',
              id_region: v.ultimo_cliente.id_region ?? null,
              id_comuna: v.ultimo_cliente.id_comuna ?? null,
              direccion: v.ultimo_cliente.direccion ?? '',
              email:     v.ultimo_cliente.email    ?? '',
              telefono:  v.ultimo_cliente.telefono ?? '',
            }
          : prev.cliente,
      }));
    } catch { /* silent */ }
  }, []);

  const lookupRut = useCallback(async (rut: string, target: 'cliente' | 'contribuyente') => {
    if (!rut.trim()) return;
    try {
      const res = await fetch(`/api/presupuestos/lookup/rut?q=${encodeURIComponent(rut.trim())}`);
      const data = await res.json();
      if (!data.success || !data.data) return;
      const p = data.data;
      const mapped = {
        rut:       p.rut       ?? '',
        nombre:    p.nombre    ?? '',
        giro:      p.giro      ?? '',
        id_region: p.id_region ?? null,
        id_comuna: p.id_comuna ?? null,
        direccion: p.direccion ?? '',
        email:     p.email     ?? '',
        telefono:  p.telefono  ?? '',
      };
      if (target === 'cliente') {
        setEncabezadoState((prev) => ({
          ...prev,
          cliente: { ...mapped, rut: prev.cliente.rut },
        }));
      } else {
        setEncabezadoState((prev) => ({
          ...prev,
          contribuyente: prev.contribuyente
            ? { ...mapped, rut: prev.contribuyente.rut }
            : null,
        }));
      }
    } catch { /* silent */ }
  }, []);

  // ---- Guardar ----

  const save = useCallback(async (): Promise<{ success: boolean; id?: number }> => {
    setSaving(true);
    try {
      const currentTotales = calcularTotales(grupos, subtotalesDirectos, encabezado.porcentaje_iva);
      const encWithTotales: EncabezadoForm = {
        ...encabezado,
        neto: currentTotales.neto,
        exento: currentTotales.exento,
        iva: currentTotales.iva,
        bruto: currentTotales.bruto,
      };

      const detallesFlat = grupos.flatMap((g) =>
        g.lineas.map(({ _tempId: _t, ...l }) => l)
      );

      const subtotalesPayload: SubtotalItem[] = currentTotales.subtotales.map((st) => ({
        orden: st.orden,
        codigo_subtotal: st.codigo_subtotal,
        nombre_subtotal: st.nombre_subtotal,
        subtotal: st.valor,
      }));

      const isUpdate = Boolean(encabezado.id);
      const res = await fetch('/api/presupuestos', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encabezado: encWithTotales,
          detalles: detallesFlat,
          subtotales: subtotalesPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        const err = new Error(buildApiErrorMessage(data, 'Error al guardar'));
        (err as Error & { isValidation?: boolean }).isValidation = isApiValidationError(data);
        throw err;
      }

      const newId = data.data?.encabezado?.id as number | undefined;
      if (data.data?.encabezado) {
        setEncabezadoState((prev) => ({
          ...prev,
          id: data.data.encabezado.id,
          numero: data.data.encabezado.numero,
        }));
      }

      notifications.show({
        title: 'Guardado',
        message: 'Presupuesto guardado correctamente',
        color: 'green',
      });
      return { success: true, id: newId };
    } catch (e: any) {
      const isValidation = e?.isValidation === true;
      notifications.show({
        title: isValidation ? 'Error de validación' : 'Error',
        message: e.message ?? 'No se pudo guardar el presupuesto',
        color: 'red',
        autoClose: isValidation ? 8000 : 4000,
        styles: { description: { whiteSpace: 'pre-line' } },
      });
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, [encabezado, grupos, subtotalesDirectos]);

  // ---- Reset ----

  const reset = useCallback(() => {
    setEncabezadoState(createEmptyEncabezado());
    setGrupos([]);
    setSubtotalesDirectos({});
  }, []);

  return {
    encabezado,
    grupos,
    subtotalesDirectos,
    totales,
    loading,
    saving,
    hasExento,
    setEncabezadoField,
    setVehiculoField,
    setClienteField,
    setContribuyenteField,
    setGrupoLineas,
    setSubtotalDirecto,
    lookupPatente,
    lookupRut,
    onTipoPresupuestoChange,
    save,
    reset,
  };
}
