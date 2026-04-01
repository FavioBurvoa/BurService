// ============================================================================
// MANTENEDOR - HOOK CON REACT QUERY
// ============================================================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import type { ApiResponse, MantenedorConfig, ComboOption } from './types';

/**
 * Hook principal para manejar el estado y operaciones del mantenedor
 */
export function useMantenedor<T extends Record<string, any>>(
  config: MantenedorConfig<T>,
  contextValue?: string | null,
) {
  const queryClient = useQueryClient();
  const { title, data: dataConfig, save: saveConfig, delete: deleteConfig, combos } = config;

  /**
   * Query para obtener datos principales.
   * Cuando hay contextConfig, espera a que haya contextValue antes de disparar
   * y añade el id_empresa como query param para filtrado server-side.
   */
  const dataQuery = useQuery({
    queryKey: ['mantenedor', dataConfig.path, contextValue ?? null],
    enabled: !config.contextConfig || !!contextValue,
    queryFn: async () => {
      let url = dataConfig.path;
      if (config.contextConfig && contextValue) {
        url += `?${config.contextConfig.field}=${contextValue}`;
      }
      const res = await fetch(url, {
        method: dataConfig.method,
      });

      const response: ApiResponse<T[]> = await res.json();

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Queries para cargar todos los combos
   */
  const comboQueries = combos
    ? Object.entries(combos).reduce(
        (acc, [key, endpoint]) => {
          acc[key] = useQuery({
            queryKey: ['combo', endpoint.static ? `static:${key}` : endpoint.path],
            queryFn: async () => {
              // Datos estáticos — sin fetch
              if (endpoint.static) return endpoint.static;

              const res = await fetch(endpoint.path!, {
                method: endpoint.method,
              });

              const response: ApiResponse<ComboOption[]> = await res.json();

              if (!response.success) {
                throw new Error(response.message);
              }

              return response.data || [];
            },
            staleTime: Infinity,
          });

          return acc;
        },
        {} as Record<string, ReturnType<typeof useQuery<ComboOption[]>>>
      )
    : {};

  /**
   * Construye objeto con datos de todos los combos
   */
  const combosData = Object.entries(comboQueries).reduce(
    (acc, [key, query]) => {
      acc[key] = query.data || [];
      return acc;
    },
    {} as Record<string, ComboOption[]>
  );

  /**
   * Verifica si algún combo está cargando
   */
  const combosLoading = Object.values(comboQueries).some((query) => query.isLoading);

  /**
   * Verifica si algún combo tiene error
   */
  const combosError = Object.values(comboQueries).find((query) => query.error);

  /**
   * Mutation para guardar (crear/editar)
   */
  const saveMutation = useMutation({
    mutationFn: async (record: T) => {
      const res = await fetch(saveConfig.path, {
        method: saveConfig.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });

      const response: ApiResponse<T> = await res.json();

      if (!response.success) {
        if (response.errors && response.errors.length > 0) {
          const errorMessages = response.errors
            .map((err) => `${err.field ? err.field + ': ' : ''}${err.detail}`)
            .join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(response.message);
      }

      return response.data;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mantenedor', dataConfig.path] });
      queryClient.invalidateQueries({ queryKey: ['combo'] });

      const isEdit = config.idField && variables[config.idField];

      notifications.show({
        title: isEdit ? `${title} actualizado` : `${title} creado`,
        message: isEdit
          ? 'Los cambios se han guardado correctamente'
          : 'El registro se ha creado correctamente',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    },

    onError: (error: Error) => {
      notifications.show({
        title: 'Error al guardar',
        message: error.message,
        color: 'red',
        icon: <IconX size={18} />,
      });
    },
  });

  /**
   * Mutation para eliminar (individual o masivo)
   */
  const deleteMutation = useMutation({
    mutationFn: async (records: T[]) => {
      const res = await fetch(deleteConfig.path, {
        method: deleteConfig.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });

      const response: ApiResponse = await res.json();

      if (!response.success) {
        throw new Error(response.message);
      }

      return response;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mantenedor', dataConfig.path] });
      queryClient.invalidateQueries({ queryKey: ['combo'] });

      const count = variables.length;
      notifications.show({
        title: count > 1 ? `${count} registros eliminados` : `${title} eliminado`,
        message:
          count > 1
            ? 'Los registros se han eliminado correctamente'
            : 'El registro se ha eliminado correctamente',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    },

    onError: (error: Error) => {
      notifications.show({
        title: 'Error al eliminar',
        message: error.message,
        color: 'red',
        icon: <IconX size={18} />,
      });
    },
  });

  return {
    data: dataQuery.data || [],
    isLoading: dataQuery.isLoading || combosLoading,
    isFetching: dataQuery.isFetching,
    error: dataQuery.error || combosError?.error,
    combos: combosData,
    saveMutation,
    deleteMutation,
    refetch: dataQuery.refetch,
  };
}
