// ============================================================================
// USE STICKY FILTERS — Persiste filtros URL-based en localStorage por vista
// ============================================================================
// Hidrata la URL desde localStorage cuando se entra a la vista sin query params
// y persiste cada cambio de URL. Aisla por usuario (email de la sesión).
// Retorna una función `clearFilters()` para limpiar URL + storage.
// ============================================================================

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useStickyFilters(viewKey: string, keys: readonly string[]) {
  const router     = useRouter();
  const pathname   = usePathname();
  const sp         = useSearchParams();
  const { data: session } = useSession();
  const userId     = session?.user?.email ?? 'anon';
  const lsKey      = `saga_ops_filters_${userId}_${viewKey}`;
  const hydrated   = useRef(false);

  // --- Hidratación: URL vacía + storage con valores → aplicar vía replace ---
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (keys.some((k) => sp.has(k))) return;

    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, string>;
      const p = new URLSearchParams();
      for (const k of keys) {
        const v = stored[k];
        if (v) p.set(k, v);
      }
      if (p.toString()) router.replace(`${pathname}?${p.toString()}`);
    } catch {
      /* JSON corrupto → ignorar */
    }
    // Solo al mount; el resto de dependencias son estables o irrelevantes aquí
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Persistencia: cada cambio de URL → localStorage ---
  useEffect(() => {
    const current: Record<string, string> = {};
    for (const k of keys) {
      const v = sp.get(k);
      if (v) current[k] = v;
    }
    if (Object.keys(current).length === 0) localStorage.removeItem(lsKey);
    else localStorage.setItem(lsKey, JSON.stringify(current));
  }, [sp, lsKey, keys]);

  const clearFilters = useCallback(() => {
    localStorage.removeItem(lsKey);
    router.replace(pathname);
  }, [lsKey, pathname, router]);

  return { clearFilters };
}
